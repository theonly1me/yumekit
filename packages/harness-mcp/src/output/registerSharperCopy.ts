import { stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { mediaFailureOf } from "../media/mediaFailures.js";
import { failureResult, successResult } from "../results.js";
import { linkOrCopy, platformFilesOf } from "./platformFiles.js";
import { sharperFilesOf } from "./sharperFiles.js";

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export function registerSharperCopy(context: HarnessContext): void {
  context.tools.add({
    name: "make_sharper_copy",
    description:
      "Make a sharper, larger copy of the rendered video of an output with the sharper media tool, next to the normal file: renders/<name>-sharper.mp4. The normal file stays. Call render_video first. The output renders once for its platforms, so the copy is made once and each chosen platform gets its own -sharper file. It costs money with a paid service, so make it only when the person asks.",
    inputSchema: {
      output_id: idInput("The id of the output."),
      platform_ids: z
        .array(z.string())
        .optional()
        .describe(
          "The platforms of the output that get a sharper file. Default: each platform of the output.",
        ),
      scale: z
        .union([z.literal(2), z.literal(4)])
        .optional()
        .describe("How many times wider and taller the copy is. Default 2."),
      server: z
        .string()
        .optional()
        .describe("The media server. Default: the server of sharper."),
      model: z
        .string()
        .min(1)
        .optional()
        .describe(
          "A sharper model of the server whose accepts has video_input.",
        ),
    },
    run: async ({ input, onProgress }) => {
      const snapshot = context.store.read();
      const rendersFolder = join(context.store.folder, "renders");
      const chosen = sharperFilesOf({
        files: platformFilesOf({
          snapshot,
          outputId: input.output_id,
          rendersFolder,
        }),
        platformIds: input.platform_ids,
      });
      if (!chosen.ok) return failureResult(chosen.failure);
      const [first, ...others] = chosen.value;
      if (!(await isFile(first.file))) {
        return failureResult({
          kind: "render-not-found",
          message: `The output "${input.output_id}" has no rendered file ${basename(first.file)} yet.`,
          hint: "Call render_video for the output first, then make_sharper_copy.",
        });
      }
      const ran = await context.mediaTools.run({
        capability: "sharper",
        ...(input.server === undefined ? {} : { server: input.server }),
        ...(input.model === undefined ? {} : { model: input.model }),
        input: { media_path: first.file, scale: input.scale ?? 2 },
        outputDirectory: rendersFolder,
        fileStem: basename(first.sharperFile, ".mp4"),
        ...(onProgress === undefined ? {} : { onProgress }),
      });
      if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
      const [made] = ran.value.result.files;
      if (made?.kind !== "video") {
        return failureResult({
          kind: "media-tool-invalid-result",
          message: `The media server "${ran.value.server}" returned no video file.`,
          hint: "Pick a sharper model whose accepts in list_media_tools has video_input.",
        });
      }
      for (const other of others) {
        await linkOrCopy({ from: made.path, to: other.sharperFile });
      }
      const files = [
        { file: made.path, platformId: first.platformId },
        ...others.map((other) => ({
          file: other.sharperFile,
          platformId: other.platformId,
        })),
      ];
      const { cost_usd: costUsd } = ran.value.result;
      return successResult({
        line: `Made the sharper copy ${files.map((entry) => entry.file).join(", ")}.`,
        data: {
          files: files.map((entry) => ({
            file: entry.file,
            ...(entry.platformId === undefined
              ? {}
              : { platform_id: entry.platformId }),
          })),
          server: ran.value.server,
          ...(ran.value.model === undefined ? {} : { model: ran.value.model }),
          ...(made.width_pixels === undefined
            ? {}
            : { width_pixels: made.width_pixels }),
          ...(made.height_pixels === undefined
            ? {}
            : { height_pixels: made.height_pixels }),
          ...(costUsd === undefined ? {} : { cost_usd: costUsd }),
        },
      });
    },
  });
}
