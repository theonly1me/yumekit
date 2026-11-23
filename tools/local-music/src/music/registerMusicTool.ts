import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  defaultTempo,
  musicModel,
  seedLimits,
  tempoLimits,
} from "../catalog.ts";
import { seedOfText } from "../compose/random.ts";
import { defaultEnergy, makeMusic } from "../makeMusic.ts";
import type { StyleEntry } from "../styles/styleList.ts";
import { errorResult, successResult, writeOutputFile } from "../toolResults.ts";
import { encodeWav } from "../wav.ts";
import { pickStyle } from "./pickStyle.ts";

export const longestSeconds = 180;

const musicInput = {
  model: z.enum([musicModel]).optional().describe(musicModel),
  prompt: z
    .string()
    .min(1)
    .max(2000)
    .describe("What the music is for. Picks a style when style is not given"),
  duration_seconds: z
    .number()
    .positive()
    .max(longestSeconds)
    .describe("Length of the music. It ends with a final hit and a short ring"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
  style: z
    .string()
    .min(1)
    .optional()
    .describe("A style from describe_media_server"),
  tempo: z
    .int()
    .min(tempoLimits.minimum)
    .max(tempoLimits.maximum)
    .optional()
    .describe("Beats each minute. 110 by default"),
  seed: z
    .int()
    .min(seedLimits.minimum)
    .max(seedLimits.maximum)
    .optional()
    .describe("The version. Another seed gives other music in the same style"),
  energy: z
    .array(z.number().min(0).max(1))
    .min(2)
    .max(8)
    .optional()
    .describe(
      "2 to 8 values from 0 to 1 spread over the length: how full the music is. For example [0.2, 0.5, 1] for a build",
    ),
};

export function registerMusicTool(options: {
  server: McpServer;
  offered: readonly StyleEntry[];
}): void {
  options.server.registerTool(
    "generate_music",
    {
      description:
        "Make a WAV music bed on this computer from code, free and with no key: drums, a bass, chords, and a lead, at a tempo, with a clean end. It leaves room for a voice.",
      inputSchema: musicInput,
    },
    async (input) => {
      const style = pickStyle({
        offered: options.offered,
        style: input.style,
        prompt: input.prompt,
      });
      if (!style.ok) return errorResult(style.failure);
      const music = makeMusic({
        style: style.value.definition,
        tempo: input.tempo ?? defaultTempo,
        durationSeconds: input.duration_seconds,
        seed: input.seed ?? seedOfText(input.prompt) + 1,
        energy: input.energy ?? defaultEnergy,
      });
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: input.file_stem,
        extension: "wav",
        bytes: encodeWav(music),
      });
      if (!written.ok) return errorResult(written.failure);
      return successResult({
        files: [
          {
            path: written.value,
            kind: "audio",
            duration_seconds: music.left.length / music.sampleRate,
          },
        ],
        cost_usd: 0,
      });
    },
  );
}
