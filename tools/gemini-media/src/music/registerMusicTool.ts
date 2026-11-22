import { z } from "zod";
import { chooseModel } from "../chooseModel.ts";
import { missingKeyMessage } from "../geminiApi.ts";
import { readImageParts } from "../imageParts.ts";
import { makeFile, type GeminiTools } from "../interactions/makeFile.ts";
import {
  checkFileStem,
  errorResult,
  successResult,
  type Outcome,
} from "../toolResults.ts";
import { readMp3DurationSeconds } from "./mp3Duration.ts";
import {
  instrumentalSentence,
  maximumMusicImages,
  musicModels,
  type MusicModelFacts,
} from "./musicModels.ts";

const musicInput = {
  prompt: z
    .string()
    .min(1)
    .describe("The style, the mood, and the instruments"),
  duration_seconds: z.number().describe("Length of the music in whole seconds"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  instrumental: z.boolean().optional().describe("No singing. True by default"),
  reference_image_paths: z
    .array(z.string().min(1))
    .max(maximumMusicImages)
    .optional()
    .describe("PNG, JPEG, or WebP pictures that set the mood"),
  model: z
    .string()
    .optional()
    .describe("The id of a model from describe_media_server"),
};

type MusicInput = z.infer<z.ZodObject<typeof musicInput>>;

function checkLength(options: {
  model: MusicModelFacts;
  seconds: number;
}): string | undefined {
  const { model, seconds } = options;
  if (
    Number.isInteger(seconds) &&
    seconds >= model.shortestSeconds &&
    seconds <= model.longestSeconds
  ) {
    return undefined;
  }
  return `duration_seconds must be a whole number from ${String(model.shortestSeconds)} to ${String(model.longestSeconds)} for ${model.id}. It was ${String(seconds)}.`;
}

function promptOf(options: {
  model: MusicModelFacts;
  input: MusicInput;
}): string {
  const { model, input } = options;
  const length = model.lengthIsInPrompt
    ? [`Make it ${String(input.duration_seconds)} seconds long.`]
    : [];
  const singing = input.instrumental === false ? [] : [instrumentalSentence];
  return [input.prompt, ...length, ...singing].join(" ");
}

export async function musicRequestBody(options: {
  model: MusicModelFacts;
  input: MusicInput;
}): Promise<Outcome<Record<string, unknown>, string>> {
  const text = promptOf(options);
  const images = await readImageParts(
    options.input.reference_image_paths ?? [],
  );
  if (!images.ok) return images;
  const input =
    images.value.length === 0
      ? text
      : [{ type: "text", text }, ...images.value];
  return { ok: true, value: { model: options.model.id, input } };
}

export function registerMusicTool(tools: GeminiTools): void {
  tools.server.registerTool(
    "generate_music",
    {
      description: `Make an MP3 file of music with a Gemini Lyria model: ${musicModels.map((model) => model.id).join(", ")}. Uses the Gemini API key of the user, which costs money for each song.`,
      inputSchema: musicInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      if (!tools.apiKey) return errorResult(missingKeyMessage);
      const model = chooseModel({
        models: musicModels,
        requested: input.model,
        kind: "music",
      });
      if (!model.ok) return errorResult(model.failure);
      const fileStem = checkFileStem(input.file_stem);
      if (!fileStem.ok) return errorResult(fileStem.failure);
      const lengthFailure = checkLength({
        model: model.value,
        seconds: input.duration_seconds,
      });
      if (lengthFailure !== undefined) return errorResult(lengthFailure);
      const body = await musicRequestBody({ model: model.value, input });
      if (!body.ok) return errorResult(body.failure);
      const made = await makeFile({
        tools,
        apiKey: tools.apiKey,
        extra,
        body: body.value,
        output: {
          type: "audio",
          defaultMimeType: "audio/mpeg",
          fallbackExtension: "mp3",
        },
        outputDirectory: input.output_directory,
        fileStem: fileStem.value,
      });
      if (!made.ok) return errorResult(made.failure);
      const durationSeconds = readMp3DurationSeconds(made.value.bytes);
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
      });
    },
  );
}
