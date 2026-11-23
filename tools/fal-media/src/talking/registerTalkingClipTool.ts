import { z } from "zod";
import { talkingModels } from "../catalog/talking/index.ts";
import { missingKeyMessage } from "../falApi.ts";
import { withoutKey, type ToolOptions } from "../toolOptions.ts";
import { errorResult, structuredResult } from "../toolResults.ts";
import { checkTalkingInput } from "./checkTalkingInput.ts";
import { makeTalkingClip } from "./makeTalkingClip.ts";

const talkingClipInput = {
  media_path: z
    .string()
    .min(1)
    .describe(
      "A PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video of the person",
    ),
  audio_path: z
    .string()
    .min(1)
    .describe("The voice file: WAV, MP3, M4A, AAC, OGG, or FLAC"),
  prompt: z
    .string()
    .optional()
    .describe(
      "How the person moves, for a model with a motion prompt. Other models ignore it",
    ),
  resolution: z
    .string()
    .optional()
    .describe("One of the resolutions of the model, for a model that has them"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  model: z
    .string()
    .optional()
    .describe(
      `Id of the model. Each model takes a picture or a video of the person, as its accepts says. With no model, the server uses the default model for the kind of the file. ${talkingModels.map((model) => model.id).join(", ")}`,
    ),
};

export function registerTalkingClipTool(options: ToolOptions): void {
  options.server.registerTool(
    "generate_talking_clip",
    {
      description:
        "Make a video clip of the person in a picture or a video who speaks the voice file, with a lip sync or talking avatar model that fal hosts. The clip has the voice as its sound and is about as long as the voice. describe_media_server lists the models and what each one takes. Uses the fal API key of the user. Each second costs money, and cost_usd is an estimate from the price of the model page.",
      inputSchema: talkingClipInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const { apiKey } = options;
      if (!apiKey) return errorResult(missingKeyMessage);
      const checked = await checkTalkingInput(input);
      if (!checked.ok) return errorResult(checked.failure);
      const made = await makeTalkingClip({
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
