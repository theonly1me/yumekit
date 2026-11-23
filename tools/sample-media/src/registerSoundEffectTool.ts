import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { modelInput, unknownModelMessage } from "./catalog.ts";
import { encodeToneWav } from "./audio/wav.ts";
import { errorResult, successResult, writeOutputFile } from "./toolResults.ts";

const soundToneHertz = 880;
const soundToneAmplitude = 0.2;
const defaultDurationSeconds = 1;
const maximumDurationSeconds = 30;

const soundEffectInput = {
  model: modelInput("sound-effect"),
  prompt: z.string().min(1).describe("Ignored by the sample server"),
  duration_seconds: z
    .number()
    .positive()
    .max(maximumDurationSeconds)
    .optional()
    .describe("Length of the sound, up to 30 seconds. Default 1"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
};

export function registerSoundEffectTool(server: McpServer): void {
  server.registerTool(
    "generate_sound_effect",
    {
      description:
        "Test tool, free, no model. Writes a WAV file with one short high tone, 1 second unless duration_seconds says otherwise. It makes no real sound effect.",
      inputSchema: soundEffectInput,
    },
    async (input) => {
      const modelFailure = unknownModelMessage({
        capability: "sound-effect",
        model: input.model,
      });
      if (modelFailure) return errorResult(modelFailure);
      const tone = encodeToneWav({
        durationSeconds: input.duration_seconds ?? defaultDurationSeconds,
        frequencyHertz: soundToneHertz,
        amplitude: soundToneAmplitude,
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
      });
    },
  );
}
