import { z } from "zod";
import { sharperModels } from "../catalog/sharper/index.ts";
import { missingKeyMessage } from "../falApi.ts";
import { withoutKey, type ToolOptions } from "../toolOptions.ts";
import { errorResult, structuredResult } from "../toolResults.ts";
import { checkSharpenInput } from "./checkSharpenInput.ts";
import { sharpenMedia } from "./sharpenMedia.ts";

const sharpenInput = {
  media_path: z
    .string()
    .min(1)
    .describe("A PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video"),
  scale: z
    .union([z.literal(2), z.literal(4)])
    .describe("How many times wider and taller the copy is: 2 or 4"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  model: z
    .string()
    .optional()
    .describe(
      `Id of the model. Each model takes pictures or video, as its accepts says. With no model, the server uses the default model for the kind of the file. ${sharperModels.map((model) => model.id).join(", ")}`,
    ),
};

export function registerSharpenTool(options: ToolOptions): void {
  options.server.registerTool(
    "sharpen_media",
    {
      description:
        "Make a sharper, larger copy of a picture or a video clip with a model that fal hosts. describe_media_server lists the models and what each one takes. Uses the fal API key of the user. Each copy costs money, and cost_usd is an estimate when the model page gives a price.",
      inputSchema: sharpenInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const { apiKey } = options;
      if (!apiKey) return errorResult(missingKeyMessage);
      const checked = await checkSharpenInput(input);
      if (!checked.ok) return errorResult(checked.failure);
      const made = await sharpenMedia({
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
