import { mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { modelIds, naturalVoiceModel } from "../catalog.ts";
import {
  defaultNaturalVoice,
  type NaturalVoice,
  type OnDownloadProgress,
} from "../naturalVoice/naturalVoice.ts";
import type { SystemVoice } from "../systemVoice/systemVoice.ts";
import {
  checkFileStem,
  errorMessage,
  errorResult,
  successResult,
  writeOutputFile,
  type Outcome,
} from "../toolResults.ts";
import { encodeLeveledWav, readWavDurationSeconds } from "./wav.ts";

const speechInput = {
  model: z
    .enum(modelIds)
    .optional()
    .describe("system-voice (the default) or natural-voice"),
  text: z.string().min(1).max(4096).describe("The words to speak"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  voice: z
    .string()
    .min(1)
    .optional()
    .describe("A voice from describe_media_server"),
  instructions: z.string().optional().describe("Not used by this server"),
  speed: z
    .number()
    .min(0.5)
    .max(2)
    .optional()
    .describe("Speed from 0.5 to 2. 1 is normal"),
};

interface SpeechRequest {
  text: string;
  voice: string | undefined;
  speed: number;
  outputDirectory: string;
  fileStem: string;
}

type Spoken = Outcome<{ path: string; durationSeconds: number }, string>;

async function speakWithSystemVoice(options: {
  systemVoice: SystemVoice;
  request: SpeechRequest;
}): Promise<Spoken> {
  const { systemVoice, request } = options;
  const voices = await systemVoice.listVoices();
  const [bestVoice] = voices;
  if (bestVoice === undefined)
    return { ok: false, failure: systemVoice.missingProgramMessage };
  const voice = request.voice ?? bestVoice;
  if (!voices.includes(voice)) {
    return {
      ok: false,
      failure: `voice must be one of: ${voices.join(", ")}. It was ${voice}.`,
    };
  }
  const directory = resolve(request.outputDirectory);
  const path = join(directory, `${request.fileStem}.wav`);
  try {
    await mkdir(directory, { recursive: true });
    const failure = await systemVoice.speak({
      text: request.text,
      voice,
      speed: request.speed,
      path,
    });
    if (failure !== undefined) return { ok: false, failure };
    const durationSeconds = readWavDurationSeconds(await readFile(path));
    if (durationSeconds === undefined || durationSeconds === 0) {
      return {
        ok: false,
        failure: "The voice of this computer wrote no sound.",
      };
    }
    return { ok: true, value: { path, durationSeconds } };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot make the voice file ${path}: ${errorMessage(error)}`,
    };
  }
}

async function speakWithNaturalVoice(options: {
  naturalVoice: NaturalVoice;
  request: SpeechRequest;
  onDownloadProgress: OnDownloadProgress;
}): Promise<Spoken> {
  const { request } = options;
  const spoken = await options.naturalVoice.speak({
    text: request.text,
    voice: request.voice ?? defaultNaturalVoice,
    speed: request.speed,
    onDownloadProgress: options.onDownloadProgress,
  });
  if (!spoken.ok) return spoken;
  const written = await writeOutputFile({
    outputDirectory: request.outputDirectory,
    fileStem: request.fileStem,
    extension: "wav",
    bytes: encodeLeveledWav(spoken.value),
  });
  if (!written.ok) return written;
  return {
    ok: true,
    value: {
      path: written.value,
      durationSeconds: spoken.value.samples.length / spoken.value.sampleRate,
    },
  };
}

export function registerSpeechTool(options: {
  server: McpServer;
  systemVoice: SystemVoice;
  naturalVoice: NaturalVoice;
}): void {
  options.server.registerTool(
    "generate_speech",
    {
      description:
        "Make a WAV file of speech on this computer, free and with no key. system-voice uses the voice of the operating system. natural-voice uses an open voice model, which downloads once at its first use. Returns no word timings.",
      inputSchema: speechInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const fileStem = checkFileStem(input.file_stem);
      if (!fileStem.ok) return errorResult(fileStem.failure);
      const request: SpeechRequest = {
        text: input.text,
        voice: input.voice,
        speed: input.speed ?? 1,
        outputDirectory: input.output_directory,
        fileStem: fileStem.value,
      };
      const progressToken = extra._meta?.progressToken;
      const spoken =
        input.model === naturalVoiceModel
          ? await speakWithNaturalVoice({
              naturalVoice: options.naturalVoice,
              request,
              onDownloadProgress: async (progress) => {
                if (progressToken === undefined) return;
                await extra.sendNotification({
                  method: "notifications/progress",
                  params: {
                    progressToken,
                    progress: progress.done,
                    total: progress.total,
                    message: `Downloading the natural voice: ${String(Math.floor((progress.done / progress.total) * 100))} percent`,
                  },
                });
              },
            })
          : await speakWithSystemVoice({
              systemVoice: options.systemVoice,
              request,
            });
      if (!spoken.ok) return errorResult(spoken.failure);
      return successResult({
        files: [
          {
            path: spoken.value.path,
            kind: "audio",
            duration_seconds: spoken.value.durationSeconds,
          },
        ],
      });
    },
  );
}
