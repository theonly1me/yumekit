import { z } from "zod";
import { catalogModels, chooseModel } from "../catalog/catalog.ts";
import { modelsWithoutInstructions } from "../catalog/speechModels.ts";
import { jsonRequest, missingKeyMessage, requestBytes } from "../openAiApi.ts";
import type { ToolOptions } from "../toolOptions.ts";
import {
  checkFileStem,
  errorResult,
  successResult,
  writeOutputFile,
} from "../toolResults.ts";
import { readWavDurationSeconds } from "./wavDuration.ts";

const fallbackVoice = "marin";

function voicesOf(model: string): { choices: string[]; default: string } {
  const setting = catalogModels
    .find((candidate) => candidate.id === model)
    ?.settings.find((candidate) => candidate.name === "voice");
  if (setting?.kind !== "choice")
    return { choices: [], default: fallbackVoice };
  return setting;
}

function checkVoice(options: {
  model: string;
  voice: string | undefined;
  instructions: string | undefined;
}): { ok: true; value: string } | { ok: false; failure: string } {
  const voices = voicesOf(options.model);
  const voice = options.voice ?? voices.default;
  if (voices.choices.length > 0 && !voices.choices.includes(voice)) {
    return {
      ok: false,
      failure: `voice must be one of: ${voices.choices.join(", ")} for ${options.model}. It was ${voice}.`,
    };
  }
  if (
    options.instructions !== undefined &&
    modelsWithoutInstructions.includes(options.model)
  ) {
    return {
      ok: false,
      failure: `${options.model} takes no instructions. Use gpt-4o-mini-tts to set the tone.`,
    };
  }
  return { ok: true, value: voice };
}

function estimatedCostOf(options: { model: string; text: string }) {
  const price = catalogModels
    .find((candidate) => candidate.id === options.model)
    ?.prices.find((candidate) => candidate.unit === "thousand-characters");
  if (!price) return {};
  return {
    cost_usd: Math.round(price.usd * options.text.length * 1000) / 1_000_000,
    cost_is_estimate: true,
  };
}

const speechInput = {
  model: z
    .string()
    .min(1)
    .optional()
    .describe("The id of a model from describe_media_server"),
  text: z.string().min(1).max(4096).describe("The words to speak"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  voice: z
    .string()
    .min(1)
    .optional()
    .describe(
      `An OpenAI voice, for example marin or cedar. ${fallbackVoice} by default`,
    ),
  instructions: z
    .string()
    .min(1)
    .max(4096)
    .optional()
    .describe("How to speak, for example the tone and the pace"),
  speed: z
    .number()
    .min(0.25)
    .max(4)
    .optional()
    .describe("Speed from 0.25 to 4. 1 is normal"),
};

export function registerSpeechTool(options: ToolOptions): void {
  options.server.registerTool(
    "generate_speech",
    {
      description: `Make a WAV file of speech with the OpenAI model ${options.model}. Returns no word timings, so call align_words after it. Uses the OpenAI API key of the user, which costs money.`,
      inputSchema: speechInput,
    },
    async (input) => {
      const chosen = chooseModel({
        capability: "speech",
        activeModel: options.model,
        requested: input.model,
      });
      if (!chosen.ok) return errorResult(chosen.failure);
      const model = chosen.value;
      if (!options.apiKey) return errorResult(missingKeyMessage);
      const fileStem = checkFileStem(input.file_stem);
      if (!fileStem.ok) return errorResult(fileStem.failure);
      const voice = checkVoice({
        model,
        voice: input.voice,
        instructions: input.instructions,
      });
      if (!voice.ok) return errorResult(voice.failure);
      const audio = await requestBytes({
        sendRequest: options.sendRequest,
        request: jsonRequest({
          path: "/audio/speech",
          apiKey: options.apiKey,
          body: {
            model,
            input: input.text,
            voice: voice.value,
            response_format: "wav",
            ...(input.instructions === undefined
              ? {}
              : { instructions: input.instructions }),
            ...(input.speed === undefined ? {} : { speed: input.speed }),
          },
        }),
      });
      if (!audio.ok) return errorResult(audio.failure);
      const durationSeconds = readWavDurationSeconds(audio.value);
      if (durationSeconds === undefined) {
        return errorResult("The OpenAI API sent audio that is not a WAV file.");
      }
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: fileStem.value,
        extension: "wav",
        bytes: audio.value,
      });
      if (!written.ok) return errorResult(written.failure);
      return successResult({
        files: [
          {
            path: written.value,
            kind: "audio",
            duration_seconds: durationSeconds,
          },
        ],
        ...estimatedCostOf({ model, text: input.text }),
      });
    },
  );
}
