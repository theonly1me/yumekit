import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { encodeToneWav } from "./audio/wav.ts";
import { errorResult, successResult, writeOutputFile } from "./toolResults.ts";

const musicToneHertz = 110;
const musicToneAmplitude = 0.1;
const maximumDurationSeconds = 600;

const musicInput = {
  prompt: z.string().min(1).describe("Ignored by the sample server"),
  duration_seconds: z
    .number()
    .positive()
    .max(maximumDurationSeconds)
    .describe("Length of the music"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
};

export function registerMusicTool(server: McpServer): void {
  server.registerTool(
    "generate_music",
    {
      description:
        "Test tool, free, no model. Writes a WAV file with one low tone of the requested length. It makes no music.",
      inputSchema: musicInput,
    },
    async (input) => {
      const tone = encodeToneWav({
        durationSeconds: input.duration_seconds,
        frequencyHertz: musicToneHertz,
        amplitude: musicToneAmplitude,
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
