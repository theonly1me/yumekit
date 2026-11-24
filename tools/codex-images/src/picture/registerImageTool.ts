import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { imageModel, maximumReferenceImages } from "../catalog.ts";
import { checkCodex } from "../readiness.ts";
import {
  checkFileStem,
  errorResult,
  successResult,
  usageLimitResult,
  writeOutputFile,
} from "../toolResults.ts";
import { runImageTurn } from "../turn/runImageTurn.ts";
import { imagePromptOf } from "./imagePrompt.ts";
import { askedSizeOf, checkShape } from "./pictureShape.ts";
import { removePictureFolder, takePicture } from "./takePicture.ts";

export interface CodexImagesOptions {
  findProgram: () => Promise<string | undefined>;
  environment: NodeJS.ProcessEnv;
  codexHome: string;
  turnLimitSeconds: number;
}

const sidePixels = z.number().int().min(16).max(3840);

const imageInput = {
  model: z.string().min(1).optional().describe(`Only "${imageModel}"`),
  prompt: z.string().min(1).describe("What the picture shows"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  width_pixels: sidePixels
    .optional()
    .describe("Width that sets the shape. Codex picks the exact size"),
  height_pixels: sidePixels
    .optional()
    .describe("Height that sets the shape. Codex picks the exact size"),
  reference_image_paths: z
    .array(z.string().min(1))
    .max(maximumReferenceImages)
    .optional()
    .describe("Absolute paths of pictures that guide the picture"),
  transparent_background: z.boolean().optional(),
};

type ImageInput = z.infer<z.ZodObject<typeof imageInput>>;

async function makePicture(options: {
  input: ImageInput;
  settings: CodexImagesOptions;
}): Promise<CallToolResult> {
  const { input, settings } = options;
  if (input.model !== undefined && input.model !== imageModel) {
    return errorResult(`Codex has one picture model: "${imageModel}".`);
  }
  const fileStem = checkFileStem(input.file_stem);
  if (!fileStem.ok) return errorResult(fileStem.failure);
  const asked = askedSizeOf({
    widthPixels: input.width_pixels,
    heightPixels: input.height_pixels,
  });
  if (!asked.ok) return errorResult(asked.failure);
  const references = input.reference_image_paths ?? [];
  if (references.some((path) => !isAbsolute(path))) {
    return errorResult("Each reference_image_paths entry must be absolute.");
  }
  const ready = await checkCodex({
    programPath: await settings.findProgram(),
    environment: settings.environment,
  });
  if (!ready.ok) return errorResult(ready.failure);
  const workingFolder = await mkdtemp(join(tmpdir(), "yumekit-codex-image-"));
  const turn = await runImageTurn({
    programPath: ready.value,
    prompt: imagePromptOf({
      prompt: input.prompt,
      asked: asked.value,
      referenceCount: references.length,
      transparentBackground: input.transparent_background ?? false,
    }),
    workingFolder,
    referenceImagePaths: references,
    environment: settings.environment,
    limitSeconds: settings.turnLimitSeconds,
  });
  try {
    if (turn.kind === "usage-limit") {
      return usageLimitResult(
        `Codex reached the usage limit of your ChatGPT plan: ${turn.message}`,
      );
    }
    if (turn.kind === "timed-out") {
      return errorResult(
        `Codex made no picture within ${String(settings.turnLimitSeconds)} seconds.`,
      );
    }
    if (turn.kind === "failed") return errorResult(turn.message);
    const picture = await takePicture({
      codexHome: settings.codexHome,
      threadId: turn.threadId,
      answer: turn.answer,
    });
    if (!picture.ok) return errorResult(picture.failure);
    const shape = checkShape({ asked: asked.value, made: picture.value.size });
    if (!shape.ok) return errorResult(shape.failure);
    const written = await writeOutputFile({
      outputDirectory: input.output_directory,
      fileStem: fileStem.value,
      bytes: picture.value.bytes,
    });
    if (!written.ok) return errorResult(written.failure);
    return successResult({
      path: written.value,
      kind: "image",
      width_pixels: picture.value.size.width,
      height_pixels: picture.value.size.height,
    });
  } finally {
    await removePictureFolder({
      codexHome: settings.codexHome,
      threadId: turn.threadId,
    });
    await rm(workingFolder, { recursive: true, force: true });
  }
}

export function registerImageTool(options: {
  server: McpServer;
  settings: CodexImagesOptions;
}): void {
  options.server.registerTool(
    "generate_image",
    {
      description:
        "Make a PNG picture with the Codex program of the person. It uses their ChatGPT plan and no key. Codex picks the exact size; width_pixels and height_pixels set the shape. One picture takes about 20 to 90 seconds.",
      inputSchema: imageInput,
    },
    (input) => makePicture({ input, settings: options.settings }),
  );
}
