import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HarnessContext } from "../context.js";
import { durationInput, frameInput, idInput, scaleInput } from "../inputs.js";
import { failureResult, successResult } from "../results.js";
import { renderChapter } from "./chapterRender.js";
import { renderFailureOf } from "./renderFailures.js";
import { renderOutputFiles } from "./renderOutputFiles.js";

function rendersFolder(context: HarnessContext): string {
  return join(context.store.folder, "renders");
}

function registerRenderVideo(context: HarnessContext): void {
  context.tools.add({
    name: "render_video",
    description:
      "Render an output to an MP4 file with sound in the renders folder of the project, and return its path, frame count, and length in seconds. An output with platforms renders once and gets one file for each platform, renders/<project name>-<platform id>.mp4; files lists each file with its platform. With chapter_id, it renders only the time of that chapter to renders/chapters/<chapter id>-<output id>.mp4: the cut of the chapter, which joins an open take of the cut of that chapter. It can take minutes; it sends progress notifications. Check the whole video with contact_sheet first. Default scale 1; use 0.25 with frame_count for a fast test.",
    inputSchema: {
      output_id: idInput("The id of the output."),
      first_frame: frameInput(
        "The first frame to render. Default 0.",
      ).optional(),
      frame_count: durationInput(
        "How many frames to render. Default: to the end of the output.",
      ).optional(),
      scale: scaleInput,
      chapter_id: idInput(
        "The chapter to render, from the chapters of get_work. Not with first_frame or frame_count.",
      ).optional(),
    },
    run: async ({
      input: { output_id, first_frame, frame_count, scale, chapter_id },
      onProgress,
    }) => {
      if (chapter_id !== undefined) {
        if (first_frame !== undefined || frame_count !== undefined) {
          return failureResult({
            kind: "invalid-input",
            message: "chapter_id renders the time of its chapter.",
            hint: "Give chapter_id, or first_frame and frame_count, not both.",
          });
        }
        return renderChapter({
          context,
          outputId: output_id,
          chapterId: chapter_id,
          scale,
          onProgress,
        });
      }
      const rendered = await renderOutputFiles({
        snapshot: context.store.read(),
        folder: context.store.folder,
        outputId: output_id,
        ...(first_frame === undefined ? {} : { firstFrame: first_frame }),
        ...(frame_count === undefined ? {} : { frameCount: frame_count }),
        ...(scale === undefined ? {} : { scale }),
        onProgress: ({ framesDone, frameCount }) => {
          onProgress?.({ done: framesDone, total: frameCount });
        },
      });
      if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
      const { video, files } = rendered.value;
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
      const rendered = await context.pictures.renderFrames({
        outputId: output_id,
        frames: [frame],
      });
      if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
      const [picture] = rendered.value;
      if (picture === undefined)
        throw new Error("render_still drew no picture");
      const file = join(
        rendersFolder(context),
        `${output_id}-frame-${String(frame)}.png`,
      );
      await mkdir(rendersFolder(context), { recursive: true });
      await writeFile(file, picture.png);
      return successResult({
        line: `Rendered frame ${String(frame)} of "${output_id}" to ${file}.`,
        data: {
          file,
          width_pixels: picture.widthPixels,
          height_pixels: picture.heightPixels,
        },
      });
    },
  });
}

export function registerRenderTools(context: HarnessContext): void {
  registerRenderVideo(context);
  registerRenderStill(context);
}
