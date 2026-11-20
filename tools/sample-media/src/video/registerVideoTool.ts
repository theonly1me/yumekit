import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  errorResult,
  prepareOutputPath,
  successResult,
} from "../toolResults.ts";
import { counterFramesOf } from "./counterFrames.ts";
import { encodeVideo } from "./encodeVideo.ts";
import {
  frameCountOf,
  videoFramesPerSecond,
  videoSizeOf,
} from "./videoShape.ts";

const maximumDurationSeconds = 60;
const maximumSidePixels = 4096;

const sidePixels = z.number().int().min(1).max(maximumSidePixels);

const videoInput = {
  prompt: z.string().min(1).describe("What the video shows"),
  duration_seconds: z
    .number()
    .positive()
    .max(maximumDurationSeconds)
    .describe("Length of the video, more than 0 and up to 60 seconds"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  first_frame_path: z
    .string()
    .optional()
    .describe("Ignored by the sample server"),
  last_frame_path: z
    .string()
    .optional()
    .describe("Ignored by the sample server"),
  reference_image_paths: z
    .array(z.string())
    .optional()
    .describe("Ignored by the sample server"),
  width_pixels: sidePixels
    .optional()
    .describe("Compared with height_pixels to choose a wide or tall video"),
  height_pixels: sidePixels
    .optional()
    .describe("Compared with width_pixels to choose a wide or tall video"),
  with_audio: z
    .boolean()
    .optional()
    .describe("Add the quiet tone as sound. Default true"),
};

export function registerVideoTool(server: McpServer): void {
  server.registerTool(
    "generate_video",
    {
      description:
        "Test tool, free, no model. Writes an MP4 of one plain color from a hash of the prompt, with a frame counter as large text and one quiet tone as sound. It draws no picture of the prompt. 24 frames per second, 1280 by 720, or 720 by 1280 when height_pixels is larger than width_pixels. Needs FFmpeg on the PATH.",
      inputSchema: videoInput,
    },
    async (input) => {
      const prepared = await prepareOutputPath({
        outputDirectory: input.output_directory,
        fileStem: input.file_stem,
        extension: "mp4",
      });
      if (!prepared.ok) return errorResult(prepared.failure);
      const { width, height } = videoSizeOf({
        widthPixels: input.width_pixels,
        heightPixels: input.height_pixels,
      });
      const frameCount = frameCountOf(input.duration_seconds);
      const encoded = await encodeVideo({
        path: prepared.value,
        width,
        height,
        frameCount,
        withAudio: input.with_audio ?? true,
        drawFrame: counterFramesOf({
          prompt: input.prompt,
          width,
          height,
          frameCount,
        }),
      });
      if (!encoded.ok) return errorResult(encoded.failure);
      return successResult({
        files: [
          {
            path: prepared.value,
            kind: "video",
            width_pixels: width,
            height_pixels: height,
            duration_seconds: frameCount / videoFramesPerSecond,
          },
        ],
      });
    },
  );
}
