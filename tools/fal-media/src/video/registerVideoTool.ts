import { z } from "zod";
import { videoModels } from "../catalog/index.ts";
import { missingKeyMessage } from "../falApi.ts";
import { withoutKey, type ToolOptions } from "../toolOptions.ts";
import { errorResult, structuredResult } from "../toolResults.ts";
import { checkVideoInput } from "./checkVideoInput.ts";
import { makeVideo } from "./makeVideo.ts";

const imagePath = z.string().min(1);
const sidePixels = z.number().int().positive();

const videoInput = {
  prompt: z.string().min(1).describe("What the clip shows and how it moves"),
  duration_seconds: z
    .number()
    .describe("Length of the clip. A whole number from 4 to 30"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  model: z
    .string()
    .optional()
    .describe(
      `Id of the model. ${videoModels.map((model) => model.id).join(", ")}`,
    ),
  resolution: z
    .string()
    .optional()
    .describe("480p, 720p, 1080p, or 4k. 720p by default"),
  with_audio: z
    .boolean()
    .optional()
    .describe("Make sound with the picture. True by default"),
  first_frame_path: imagePath
    .optional()
    .describe("PNG, JPEG, or WebP file for the first frame"),
  last_frame_path: imagePath
    .optional()
    .describe("PNG, JPEG, or WebP file for the last frame"),
  reference_image_paths: z
    .array(imagePath)
    .optional()
    .describe("Not supported by this server"),
  width_pixels: sidePixels
    .optional()
    .describe("Wanted width. The server picks the nearest supported shape"),
  height_pixels: sidePixels
    .optional()
    .describe("Wanted height. The server picks the nearest supported shape"),
};

export function registerVideoTool(options: ToolOptions): void {
  options.server.registerTool(
    "generate_video",
    {
      description:
        "Make an MP4 clip with a video model that fal hosts, from a prompt and an optional first frame. Uses the fal API key of the user. Each second costs money, and cost_usd is an estimate from the price list. With first_frame_path, the clip takes the shape of that image.",
      inputSchema: videoInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const { apiKey } = options;
      if (!apiKey) return errorResult(missingKeyMessage);
      const checked = checkVideoInput(input);
      if (!checked.ok) return errorResult(checked.failure);
      const progressToken = extra._meta?.progressToken;
      let pollCount = 0;
      const made = await makeVideo({
        input: checked.value,
        sendRequest: options.sendRequest,
        apiKey,
        wait: options.wait,
        signal: extra.signal,
        onPoll: async (status) => {
          pollCount += 1;
          if (progressToken === undefined) return;
          await extra.sendNotification({
            method: "notifications/progress",
            params: {
              progressToken,
              progress: pollCount,
              message: `fal status: ${status}`,
            },
          });
        },
      });
      if (!made.ok) {
        return errorResult(withoutKey({ message: made.failure, apiKey }));
      }
      return structuredResult(made.value);
    },
  );
}
