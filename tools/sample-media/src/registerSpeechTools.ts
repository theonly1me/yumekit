import { readFile } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { encodeToneWav, readWavDurationSeconds } from "./audio/wav.ts";
import { evenWordTimings, splitWords } from "./audio/wordTimings.ts";
import { errorResult, successResult, writeOutputFile } from "./toolResults.ts";

const secondsPerWord = 0.3;
const speechToneHertz = 440;
const speechToneAmplitude = 0.05;

const speechInput = {
  text: z.string().min(1).describe("The words to speak"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  voice: z.string().optional().describe("Ignored by the sample server"),
  instructions: z.string().optional().describe("Ignored by the sample server"),
  speed: z
    .number()
    .positive()
    .optional()
    .describe("Ignored by the sample server"),
};

const alignInput = {
  audio_path: z.string().min(1).describe("A WAV file to align"),
  text: z.string().min(1).describe("The words in the audio"),
  language: z.string().optional().describe("Ignored by the sample server"),
};

function registerSpeechTool(server: McpServer): void {
  server.registerTool(
    "generate_speech",
    {
      description:
        "Test tool, free, no model. Writes a WAV file with one quiet tone, 0.3 seconds for each word, and even word timings. It makes no voice.",
      inputSchema: speechInput,
    },
    async (input) => {
      const words = splitWords(input.text);
      if (words.length === 0) return errorResult("text has no words");
      const tone = encodeToneWav({
        durationSeconds: words.length * secondsPerWord,
        frequencyHertz: speechToneHertz,
        amplitude: speechToneAmplitude,
      });
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: input.file_stem,
        extension: "wav",
        bytes: tone.bytes,
      });
      if (!written.ok) return errorResult(written.failure);
      return successResult({
        files: [
          {
            path: written.value,
            kind: "audio",
            duration_seconds: tone.durationSeconds,
          },
        ],
        words: evenWordTimings({
          words,
          durationSeconds: tone.durationSeconds,
        }),
      });
    },
  );
}

async function readAudio(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch {
    return undefined;
  }
}

function registerAlignTool(server: McpServer): void {
  server.registerTool(
    "align_words",
    {
      description:
        "Test tool, free, no model. Spreads the words evenly over the length of a WAV file. It does not listen to the audio, and it writes no file.",
      inputSchema: alignInput,
    },
    async (input) => {
      const words = splitWords(input.text);
      if (words.length === 0) return errorResult("text has no words");
      const bytes = await readAudio(input.audio_path);
      if (!bytes) return errorResult(`Cannot read ${input.audio_path}`);
      const durationSeconds = readWavDurationSeconds(bytes);
      if (durationSeconds === undefined) {
        return errorResult(
          `${input.audio_path} is not a WAV file. The sample server aligns only WAV files.`,
        );
      }
      return successResult({
        files: [],
        words: evenWordTimings({ words, durationSeconds }),
      });
    },
  );
}

export function registerSpeechTools(server: McpServer): void {
  registerSpeechTool(server);
  registerAlignTool(server);
}
