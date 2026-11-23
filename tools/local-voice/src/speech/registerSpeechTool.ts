import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { modelIds } from "../catalog.ts";
import type { NaturalVoice } from "../naturalVoice/naturalVoice.ts";
import {
  checkFileStem,
  errorResult,
  successResult,
  writeOutputFile,
} from "../toolResults.ts";
import { progressReporterOf } from "./downloadProgress.ts";
import { encodeLeveledWav } from "./wav.ts";

const speechInput = {
  model: z.enum(modelIds).optional().describe("natural-voice"),
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
  pronunciations: z
    .record(z.string().min(1), z.string().min(1))
    .optional()
    .describe(
      'How to say a name that is not a common English word, in common English words. For example {"Hoshi": "hoe she"}. The text keeps the name.',
    ),
};

export function registerSpeechTool(options: {
  server: McpServer;
  naturalVoice: NaturalVoice;
  defaultVoice: string;
  downloadLine: string;
}): void {
  options.server.registerTool(
    "generate_speech",
    {
      description:
        "Make a WAV file of speech on this computer with an open voice model, free and with no key. The model downloads once at its first use. Returns no word timings.",
      inputSchema: speechInput,
    },
    async (...parameters) => {
      const [input, extra] = parameters;
      const fileStem = checkFileStem(input.file_stem);
      if (!fileStem.ok) return errorResult(fileStem.failure);
      const spoken = await options.naturalVoice.speak({
        text: input.text,
        voice: input.voice ?? options.defaultVoice,
        speed: input.speed ?? 1,
        pronunciations: input.pronunciations ?? {},
        onDownloadProgress: progressReporterOf({
          extra,
          line: options.downloadLine,
        }),
      });
      if (!spoken.ok) return errorResult(spoken.failure);
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: fileStem.value,
        extension: "wav",
        bytes: encodeLeveledWav(spoken.value),
      });
      if (!written.ok) return errorResult(written.failure);
      return successResult({
        files: [
          {
            path: written.value,
            kind: "audio",
            duration_seconds:
              spoken.value.samples.length / spoken.value.sampleRate,
          },
        ],
      });
    },
  );
}

export function registerPrepareTool(options: {
  server: McpServer;
  naturalVoice: NaturalVoice;
  downloadLine: string;
}): void {
  options.server.registerTool(
    "prepare_model",
    {
      description:
        "Download the files of a model that runs on this computer, once, with progress. A later call does nothing.",
      inputSchema: { model: z.enum(modelIds).optional() },
    },
    async (...parameters) => {
      const [, extra] = parameters;
      const downloaded = await options.naturalVoice.download(
        progressReporterOf({ extra, line: options.downloadLine }),
      );
      if (!downloaded.ok) return errorResult(downloaded.failure);
      return successResult({ files: [] });
    },
  );
}
