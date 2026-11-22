import { z } from "zod";
import { imageModels } from "../catalog/image/index.ts";
import { missingKeyMessage } from "../falApi.ts";
import { withoutKey, type ToolOptions } from "../toolOptions.ts";
import { errorResult, structuredResult } from "../toolResults.ts";
import { checkImageInput } from "./checkImageInput.ts";
import { makeImage } from "./makeImage.ts";

const sidePixels = z.number().int().positive();

const imageInput = {
  prompt: z.string().min(1).describe("What the picture shows"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  model: z
    .string()
    .optional()
    .describe(
      `Id of the model. ${imageModels.map((model) => model.id).join(", ")}`,
    ),
  width_pixels: sidePixels
    .optional()
    .describe("Wanted width. The server picks the nearest supported shape"),
  height_pixels: sidePixels
    .optional()
    .describe("Wanted height. The server picks the nearest supported shape"),
  reference_image_paths: z
    .array(z.string().min(1))
    .optional()
    .describe(
      "PNG, JPEG, or WebP pictures of a person, a place, or a product to keep, for a model that accepts them",
    ),
  transparent_background: z
    .boolean()
    .optional()
    .describe("Make the background transparent, for a model that can"),
  resolution: z
    .string()
    .optional()
    .describe(
      "For a model with a resolution setting. describe_media_server lists the values",
    ),
  quality: z
    .string()
    .optional()
    .describe(
      "For a model with a quality setting. describe_media_server lists the values",
    ),
};

export function registerImageTool(options: ToolOptions): void {
  options.server.registerTool(
    "generate_image",
    {
      description:
        "Make a picture with a model that fal hosts, from a prompt and optional reference pictures. describe_media_server lists the models, their settings, and what each one accepts. Uses the fal API key of the user. Each picture costs money, and cost_usd is an estimate from the price list when the model page gives a price.",
      inputSchema: imageInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const { apiKey } = options;
      if (!apiKey) return errorResult(missingKeyMessage);
      const checked = checkImageInput(input);
      if (!checked.ok) return errorResult(checked.failure);
      const made = await makeImage({
        input: checked.value,
        sendRequest: options.sendRequest,
        apiKey,
        wait: options.wait,
        signal: extra.signal,
        onPoll: () => Promise.resolve(),
      });
      if (!made.ok) {
        return errorResult(withoutKey({ message: made.failure, apiKey }));
      }
      return structuredResult(made.value);
    },
  );
}
