import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { missingKeyMessage, type SendRequest } from "../openAiApi.ts";
import {
  checkFileStem,
  errorResult,
  successResult,
  writeOutputFile,
} from "../toolResults.ts";
import { readPngSize, requestedSize } from "./imageSize.ts";
import { requestImage } from "./requestImage.ts";

const sidePixels = z.number().int().min(16).max(3840);

const imageInput = {
  prompt: z.string().min(1).describe("What the image shows"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  width_pixels: sidePixels
    .optional()
    .describe(
      "Width of the image. A multiple of 16. Give it with height_pixels",
    ),
  height_pixels: sidePixels
    .optional()
    .describe(
      "Height of the image. A multiple of 16. Give it with width_pixels",
    ),
  reference_image_paths: z
    .array(z.string().min(1))
    .max(16)
    .optional()
    .describe("PNG, JPEG, or WebP files that guide the image"),
  transparent_background: z
    .boolean()
    .optional()
    .describe("Make a PNG with a transparent background"),
};

export interface ImageToolOptions {
  server: McpServer;
  apiKey: string | undefined;
  imageModel: string;
  sendRequest: SendRequest;
}

export function registerImageTool(options: ImageToolOptions): void {
  options.server.registerTool(
    "generate_image",
    {
      description: `Make a PNG image with the OpenAI model ${options.imageModel}. Uses the OpenAI API key of the user, which costs money.`,
      inputSchema: imageInput,
    },
    async (input) => {
      if (!options.apiKey) return errorResult(missingKeyMessage);
      const fileStem = checkFileStem(input.file_stem);
      if (!fileStem.ok) return errorResult(fileStem.failure);
      const size = requestedSize({
        widthPixels: input.width_pixels,
        heightPixels: input.height_pixels,
      });
      if (!size.ok) return errorResult(size.failure);
      const image = await requestImage({
        sendRequest: options.sendRequest,
        apiKey: options.apiKey,
        model: options.imageModel,
        prompt: input.prompt,
        size: size.value,
        transparentBackground: input.transparent_background ?? false,
        referenceImagePaths: input.reference_image_paths ?? [],
      });
      if (!image.ok) return errorResult(image.failure);
      const pngSize = readPngSize(image.value);
      if (!pngSize)
        return errorResult("The OpenAI API sent an image that is not a PNG.");
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: fileStem.value,
        extension: "png",
        bytes: image.value,
      });
      if (!written.ok) return errorResult(written.failure);
      return successResult({
        files: [
          {
            path: written.value,
            kind: "image",
            width_pixels: pngSize.width,
            height_pixels: pngSize.height,
          },
        ],
      });
    },
  );
}
