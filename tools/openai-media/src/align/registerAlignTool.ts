import { z } from "zod";
import { chooseModel, estimatedCostOf } from "../catalog/catalog.ts";
import { formRequest, missingKeyMessage, requestJson } from "../openAiApi.ts";
import type { ToolOptions } from "../toolOptions.ts";
import { errorResult, successResult, type WordTiming } from "../toolResults.ts";
import { readAudioFile } from "./readAudioFile.ts";

const alignInput = {
  model: z
    .string()
    .min(1)
    .optional()
    .describe("The id of a model from describe_media_server"),
  audio_path: z.string().min(1).describe("The audio file to align"),
  text: z
    .string()
    .min(1)
    .describe("The words in the audio. The server does not send it"),
  language: z
    .string()
    .regex(/^[a-z]{2}$/)
    .optional()
    .describe("ISO-639-1 code of the spoken language, for example en"),
};

const verboseTranscription = z.object({
  duration: z.number().nonnegative().optional(),
  words: z
    .array(z.object({ word: z.string(), start: z.number(), end: z.number() }))
    .optional(),
});

function transcriptionForm(options: {
  model: string;
  audio: File;
  language: string | undefined;
}): FormData {
  const form = new FormData();
  form.append("file", options.audio);
  form.append("model", options.model);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  if (options.language !== undefined) {
    form.append("language", options.language);
  }
  return form;
}

export function registerAlignTool(options: ToolOptions): void {
  options.server.registerTool(
    "align_words",
    {
      description: `Return the start and the end of each spoken word in seconds, with the OpenAI model ${options.model}. Writes no file. Uses the OpenAI API key of the user, which costs money.`,
      inputSchema: alignInput,
    },
    async (input) => {
      const chosen = chooseModel({
        capability: "align",
        activeModel: options.model,
        requested: input.model,
      });
      if (!chosen.ok) return errorResult(chosen.failure);
      const model = chosen.value;
      if (!options.apiKey) return errorResult(missingKeyMessage);
      const audio = await readAudioFile(input.audio_path);
      if (!audio.ok) return errorResult(audio.failure);
      const sent = await requestJson({
        sendRequest: options.sendRequest,
        request: formRequest({
          path: "/audio/transcriptions",
          apiKey: options.apiKey,
          form: transcriptionForm({
            model,
            audio: audio.value,
            language: input.language,
          }),
        }),
      });
      if (!sent.ok) return errorResult(sent.failure);
      const body = verboseTranscription.safeParse(sent.value);
      if (!body.success || body.data.words === undefined) {
        return errorResult(
          `The OpenAI model ${model} returned no word timestamps. Set YUMEKIT_OPENAI_ALIGN_MODEL to a model that gives them, such as whisper-1.`,
        );
      }
      const words: WordTiming[] = body.data.words.map((word) => ({
        text: word.word,
        start_seconds: word.start,
        end_seconds: word.end,
      }));
      const { duration } = body.data;
      const cost =
        duration === undefined
          ? undefined
          : estimatedCostOf({ model, minutes: duration / 60 });
      return successResult({ files: [], words, ...cost });
    },
  );
}
