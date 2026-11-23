import { z } from "zod";
import { soundModels } from "../catalog/sound/index.ts";
import { missingKeyMessage } from "../falApi.ts";
import { withoutKey, type ToolOptions } from "../toolOptions.ts";
import { errorResult, structuredResult } from "../toolResults.ts";
import { checkSoundInput } from "./checkSoundInput.ts";
import { makeSound } from "./makeSound.ts";

const soundEffectInput = {
  prompt: z
    .string()
    .min(1)
    .describe("What the sound is, for example a door that slams"),
  duration_seconds: z
    .number()
    .positive()
    .optional()
    .describe(
      "Length of the sound. describe_media_server gives the range of each model. With no value, ElevenLabs picks a length from the prompt and each other model makes 5 seconds",
    ),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  model: z
    .string()
    .optional()
    .describe(
      `Id of the model. ${soundModels.map((model) => model.id).join(", ")}`,
    ),
};

export function registerSoundEffectTool(options: ToolOptions): void {
  options.server.registerTool(
    "generate_sound_effect",
    {
      description:
        "Make a sound effect with a model that fal hosts, from a prompt. describe_media_server lists the models, their lengths, and their prices. Uses the fal API key of the user. Each sound costs money, and cost_usd is an estimate from the price list when the model page gives a price and the call gives a length.",
      inputSchema: soundEffectInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const { apiKey } = options;
      if (!apiKey) return errorResult(missingKeyMessage);
      const checked = checkSoundInput(input);
      if (!checked.ok) return errorResult(checked.failure);
      const made = await makeSound({
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
