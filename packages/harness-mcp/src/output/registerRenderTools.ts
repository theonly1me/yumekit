import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderFrame, renderVideo } from "@yumekit/render";
import type { HarnessContext } from "../context.js";
import { durationInput, frameInput, idInput, scaleInput } from "../inputs.js";
import { failureResult, successResult } from "../results.js";
import { linkOrCopy, platformFilesOf } from "./platformFiles.js";
import { renderFailureOf } from "./renderFailures.js";

function rendersFolder(context: HarnessContext): string {
  return join(context.store.folder, "renders");
}

function registerRenderVideo(context: HarnessContext): void {
  context.tools.add({
    name: "render_video",
    description:
      "Render an output to an MP4 file with sound in the renders folder of the project, and return its path, frame count, and length in seconds. An output with platforms renders once and gets one file for each platform, renders/<project name>-<platform id>.mp4; files lists each file with its platform. It can take minutes; it sends progress notifications. Check frames with preview_frames first. Default scale 1; use 0.25 with frame_count for a fast test.",
    inputSchema: {
      output_id: idInput("The id of the output."),
      first_frame: frameInput(
        "The first frame to render. Default 0.",
      ).optional(),
      frame_count: durationInput(
        "How many frames to render. Default: to the end of the output.",
      ).optional(),
      scale: scaleInput,
    },
    run: async ({
      input: { output_id, first_frame, frame_count, scale },
      onProgress,
    }) => {
      const [first, ...others] = platformFilesOf({
        snapshot: context.store.read(),
        outputId: output_id,
        rendersFolder: rendersFolder(context),
      });
      await rm(first.file, { force: true });
      const rendered = await renderVideo({
        folder: context.store.folder,
        outputId: output_id,
        destination: first.file,
        ...(first_frame === undefined ? {} : { firstFrame: first_frame }),
        ...(frame_count === undefined ? {} : { frameCount: frame_count }),
        ...(scale === undefined ? {} : { scale }),
        onProgress: ({ framesDone, frameCount }) => {
          onProgress?.({ done: framesDone, total: frameCount });
        },
      });
      if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
      const video = rendered.value;
      for (const other of others) {
        await linkOrCopy({ from: video.file, to: other.file });
      }
      const files = [{ ...first, file: video.file }, ...others];
      return successResult({
        line: `Rendered ${String(video.frameCount)} frames (${video.durationSeconds.toFixed(2)} seconds) to ${files.map((entry) => entry.file).join(", ")}.`,
        data: {
          file: video.file,
          files: files.map((entry) => ({
            file: entry.file,
            ...(entry.platformId === undefined
              ? {}
              : { platform_id: entry.platformId }),
          })),
          frame_count: video.frameCount,
          duration_seconds: video.durationSeconds,
          width_pixels: video.widthPixels,
          height_pixels: video.heightPixels,
        },
      });
    },
  });
}

function registerRenderStill(context: HarnessContext): void {
  context.tools.add({
    name: "render_still",
    description:
      "Render one frame of an output at full size to a PNG file in the renders folder, for example a thumbnail, and return its path.",
    inputSchema: {
      output_id: idInput("The id of the output."),
      frame: frameInput(
        "The frame of the output, from 0 to length_frames - 1.",
      ),
    },
    run: async ({ input: { output_id, frame } }) => {
      const rendered = await renderFrame({
        folder: context.store.folder,
        outputId: output_id,
        frame,
      });
      if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
      const file = join(
        rendersFolder(context),
        `${output_id}-frame-${String(frame)}.png`,
      );
      await mkdir(rendersFolder(context), { recursive: true });
      await writeFile(file, rendered.value.png);
      return successResult({
        line: `Rendered frame ${String(frame)} of "${output_id}" to ${file}.`,
        data: {
          file,
          width_pixels: rendered.value.widthPixels,
          height_pixels: rendered.value.heightPixels,
        },
      });
    },
  });
}

export function registerRenderTools(context: HarnessContext): void {
  registerRenderVideo(context);
  registerRenderStill(context);
}
