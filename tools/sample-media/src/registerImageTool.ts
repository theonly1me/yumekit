import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { drawPromptImage } from "./image/drawPromptImage.ts";
import { encodePng } from "./image/png.ts";
import { errorResult, successResult, writeOutputFile } from "./toolResults.ts";

const defaultSidePixels = 1024;
const maximumSidePixels = 4096;

const sidePixels = z.number().int().min(1).max(maximumSidePixels);

const imageInput = {
  prompt: z.string().min(1).describe("What the image shows"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  width_pixels: sidePixels.optional().describe("Width of the image"),
  height_pixels: sidePixels.optional().describe("Height of the image"),
  reference_image_paths: z
    .array(z.string())
    .optional()
    .describe("Ignored by the sample server"),
  transparent_background: z
    .boolean()
    .optional()
    .describe("Draw only the text on a transparent background"),
};

export function registerImageTool(server: McpServer): void {
  server.registerTool(
    "generate_image",
    {
      description:
        "Test tool, free, no model. Draws a PNG of one plain color from a hash of the prompt, with the prompt written on it as text. It draws no picture of the prompt.",
      inputSchema: imageInput,
    },
    async (input) => {
      const width = input.width_pixels ?? defaultSidePixels;
      const height = input.height_pixels ?? defaultSidePixels;
      const image = drawPromptImage({
        prompt: input.prompt,
        width,
        height,
        transparentBackground: input.transparent_background ?? false,
      });
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: input.file_stem,
        extension: "png",
        bytes: encodePng(image),
      });
      if (!written.ok) return errorResult(written.failure);
      return successResult({
        files: [
          {
            path: written.value,
            kind: "image",
            width_pixels: width,
            height_pixels: height,
          },
        ],
      });
    },
  );
}
