import { z } from "zod";
import { chooseModel } from "../chooseModel.ts";
import { missingKeyMessage } from "../geminiApi.ts";
import { makeFile, type GeminiTools } from "../interactions/makeFile.ts";
import { checkFileStem, errorResult, successResult } from "../toolResults.ts";
import { defaultVoice, geminiVoices, speechModels } from "./speechModels.ts";
import { readWavDurationSeconds } from "./wavDuration.ts";

const speechInput = {
  text: z.string().min(1).describe("The words to speak"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  voice: z
    .string()
    .optional()
    .describe(
      `A Gemini voice, for example Kore or Puck. ${defaultVoice} by default`,
    ),
  instructions: z
    .string()
    .min(1)
    .optional()
    .describe("How to speak, for example cheerful and friendly"),
  speed: z
    .number()
    .optional()
    .describe("Not a Gemini setting. Ask for the pace in instructions"),
  model: z
    .string()
    .optional()
    .describe("The id of a model from describe_media_server"),
};

type SpeechInput = z.infer<z.ZodObject<typeof speechInput>>;

export function speechRequestBody(options: {
  model: string;
  input: SpeechInput;
}): Record<string, unknown> {
  const { input } = options;
  const annotations =
    input.instructions === undefined
      ? {}
      : {
          annotations: [{ type: "speech_metadata", style: input.instructions }],
        };
  return {
    model: options.model,
    input: [
      {
        type: "user_input",
        content: [{ type: "text", text: input.text, ...annotations }],
      },
    ],
    response_format: { type: "audio" },
    generation_config: {
      speech_config: [{ voice: input.voice ?? defaultVoice }],
    },
  };
}

function checkSettings(input: SpeechInput): string | undefined {
  if (input.speed !== undefined) {
    return "The Gemini voices have no speed setting. Ask for the pace in instructions, for example: speak slowly.";
  }
  const voice = input.voice ?? defaultVoice;
  if (!geminiVoices.includes(voice)) {
    return `voice must be one of: ${geminiVoices.join(", ")}. It was ${voice}.`;
  }
  return undefined;
}

export function registerSpeechTool(tools: GeminiTools): void {
  tools.server.registerTool(
    "generate_speech",
    {
      description: `Make a WAV file of speech with a Gemini voice model: ${speechModels.map((model) => model.id).join(", ")}. Returns no word timings, so align the words after it. Uses the Gemini API key of the user, which costs money.`,
      inputSchema: speechInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      if (!tools.apiKey) return errorResult(missingKeyMessage);
      const model = chooseModel({
        models: speechModels,
        requested: input.model,
        kind: "speech",
      });
      if (!model.ok) return errorResult(model.failure);
      const fileStem = checkFileStem(input.file_stem);
      if (!fileStem.ok) return errorResult(fileStem.failure);
      const settingFailure = checkSettings(input);
      if (settingFailure !== undefined) return errorResult(settingFailure);
      const made = await makeFile({
        tools,
        apiKey: tools.apiKey,
        extra,
        body: speechRequestBody({ model: model.value.id, input }),
        output: {
          type: "audio",
          defaultMimeType: "audio/wav",
          fallbackExtension: "wav",
        },
        outputDirectory: input.output_directory,
        fileStem: fileStem.value,
      });
      if (!made.ok) return errorResult(made.failure);
      const durationSeconds = readWavDurationSeconds(made.value.bytes);
      return successResult({
        files: [
          {
            path: made.value.path,
            kind: "audio",
            ...(durationSeconds === undefined
              ? {}
              : { duration_seconds: durationSeconds }),
          },
        ],
        ...(durationSeconds === undefined
          ? {}
          : {
              cost_usd:
                Math.round(
                  durationSeconds * model.value.usdPerSecond * 1_000_000,
                ) / 1_000_000,
              cost_is_estimate: true,
            }),
      });
    },
  );
}
