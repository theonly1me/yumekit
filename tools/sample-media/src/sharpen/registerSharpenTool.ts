import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { modelInput, unknownModelMessage } from "../catalog.ts";
import {
  errorResult,
  prepareOutputPath,
  successResult,
} from "../toolResults.ts";
import { mediaFactsOf, type MediaFacts } from "./mediaFacts.ts";
import { runProgram } from "./runProgram.ts";

const sharpenInput = {
  model: modelInput("sharper"),
  media_path: z
    .string()
    .min(1)
    .describe("A PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video"),
  scale: z
    .union([z.literal(2), z.literal(4)])
    .describe("How many times wider and taller the copy is: 2 or 4"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
};

function scaleArguments(options: {
  facts: MediaFacts;
  inputPath: string;
  outputPath: string;
  scale: number;
}): string[] {
  const { facts, scale } = options;
  const size = `scale=${String(facts.widthPixels * scale)}:${String(facts.heightPixels * scale)}:flags=lanczos`;
  const start = ["-v", "error", "-y", "-i", options.inputPath, "-vf", size];
  if (facts.kind === "image") {
    return [...start, "-frames:v", "1", options.outputPath];
  }
  return [
    ...start,
    ...["-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p"],
    ...(facts.hasAudio ? ["-c:a", "aac"] : []),
    ...["-movflags", "+faststart", options.outputPath],
  ];
}

export function registerSharpenTool(server: McpServer): void {
  server.registerTool(
    "sharpen_media",
    {
      description:
        "Test tool, free, no model. Writes a plain larger copy of a picture (PNG) or a video (MP4) with FFmpeg, 2 or 4 times wider and taller. It adds no detail. Needs FFmpeg on the PATH.",
      inputSchema: sharpenInput,
    },
    async (input) => {
      const modelFailure = unknownModelMessage({
        capability: "sharper",
        model: input.model,
      });
      if (modelFailure) return errorResult(modelFailure);
      const facts = await mediaFactsOf(input.media_path);
      if (!facts.ok) return errorResult(facts.failure);
      const prepared = await prepareOutputPath({
        outputDirectory: input.output_directory,
        fileStem: input.file_stem,
        extension: facts.value.kind === "image" ? "png" : "mp4",
      });
      if (!prepared.ok) return errorResult(prepared.failure);
      const scaled = await runProgram({
        program: "ffmpeg",
        arguments: scaleArguments({
          facts: facts.value,
          inputPath: input.media_path,
          outputPath: prepared.value,
          scale: input.scale,
        }),
      });
      if (!scaled.ok) return errorResult(scaled.failure);
      return successResult({
        files: [
          {
            path: prepared.value,
            kind: facts.value.kind,
            width_pixels: facts.value.widthPixels * input.scale,
            height_pixels: facts.value.heightPixels * input.scale,
          },
        ],
      });
    },
  );
}
