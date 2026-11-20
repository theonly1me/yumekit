import { z } from "zod";
import { chooseModel } from "../catalog/catalog.ts";
import { jsonRequest, missingKeyMessage, requestBytes } from "../openAiApi.ts";
import type { ToolOptions } from "../toolOptions.ts";
import {
  checkFileStem,
  errorResult,
  successResult,
  writeOutputFile,
} from "../toolResults.ts";
import { readWavDurationSeconds } from "./wavDuration.ts";

export const defaultVoice = "marin";

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
      `An OpenAI voice, for example marin or cedar. ${defaultVoice} by default`,
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
      const audio = await requestBytes({
        sendRequest: options.sendRequest,
        request: jsonRequest({
          path: "/audio/speech",
          apiKey: options.apiKey,
          body: {
            model,
            input: input.text,
            voice: input.voice ?? defaultVoice,
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
      });
    },
  );
}
