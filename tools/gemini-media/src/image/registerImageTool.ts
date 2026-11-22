import { missingKeyMessage } from "../geminiApi.ts";
import { makeFile, type GeminiTools } from "../interactions/makeFile.ts";
import { errorResult, successResult } from "../toolResults.ts";
import { checkImageInput, imageInput } from "./imageInput.ts";
import { imageModels } from "./imageModels.ts";
import { imageRequestBody } from "./imageRequestBody.ts";
import { readPictureSize } from "./pictureSize.ts";

const description = `Make a picture with a Gemini image model: ${imageModels.map((model) => model.id).join(", ")}. Uses the Gemini API key of the user, which costs money for each picture.`;

export function registerImageTool(tools: GeminiTools): void {
  tools.server.registerTool(
    "generate_image",
    { description, inputSchema: imageInput },
    async (...parameters) => {
      const [input, extra] = parameters;
      if (!tools.apiKey) return errorResult(missingKeyMessage);
      const plan = checkImageInput(input);
      if (!plan.ok) return errorResult(plan.failure);
      const body = await imageRequestBody(plan.value);
      if (!body.ok) return errorResult(body.failure);
      const made = await makeFile({
        tools,
        apiKey: tools.apiKey,
        extra,
        body: body.value,
        output: {
          type: "image",
          defaultMimeType: "image/png",
          fallbackExtension: "png",
        },
        outputDirectory: input.output_directory,
        fileStem: plan.value.fileStem,
      });
      if (!made.ok) return errorResult(made.failure);
      const size = readPictureSize(made.value.bytes);
      return successResult({
        files: [
          {
            path: made.value.path,
            kind: "image",
            ...(size === undefined
              ? {}
              : { width_pixels: size.width, height_pixels: size.height }),
          },
        ],
      });
    },
  );
}
