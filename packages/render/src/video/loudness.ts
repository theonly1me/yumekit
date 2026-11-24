import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type { AudioMix } from "./audioMix.js";

const runFile = promisify(execFile);

export const loudnessTarget = {
  integratedLufs: -14,
  truePeakDecibels: -1,
} as const;

const largestGainDecibels = 24;
const limiterCeiling = 0.8414;
const limiter = `alimiter=limit=${String(limiterCeiling)}:attack=5:release=50:level=disabled`;

const loudnessSchema = z.object({
  input_i: z.coerce.number(),
  input_tp: z.coerce.number(),
});

export interface MixLoudness {
  integratedLufs: number;
  truePeakDecibels: number;
}

function lastJsonBlock(text: string): unknown {
  const start = text.lastIndexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

export async function measureMix(
  mix: AudioMix,
): Promise<MixLoudness | undefined> {
  const graph = `${mix.filterGraph};${mix.outputLabel}loudnorm=I=${String(loudnessTarget.integratedLufs)}:TP=${String(loudnessTarget.truePeakDecibels)}:print_format=json[measured]`;
  try {
    const { stderr } = await runFile("ffmpeg", [
      ...["-hide_banner", "-nostats"],
      ...mix.inputFiles.flatMap((file) => ["-i", file]),
      ...["-filter_complex", graph, "-map", "[measured]", "-f", "null", "-"],
    ]);
    const parsed = loudnessSchema.safeParse(lastJsonBlock(stderr));
    if (!parsed.success) return undefined;
    const { input_i: integratedLufs, input_tp: truePeakDecibels } = parsed.data;
    if (!Number.isFinite(integratedLufs)) return undefined;
    return { integratedLufs, truePeakDecibels };
  } catch {
    return undefined;
  }
}

export function levelingOf(loudness: MixLoudness): {
  gainDecibels: number;
  isLimited: boolean;
} {
  const wanted = loudnessTarget.integratedLufs - loudness.integratedLufs;
  const gainDecibels =
    Math.round(
      Math.max(-largestGainDecibels, Math.min(largestGainDecibels, wanted)) *
        100,
    ) / 100;
  return {
    gainDecibels,
    isLimited:
      loudness.truePeakDecibels + gainDecibels >
      loudnessTarget.truePeakDecibels,
  };
}

export function leveledMix(options: {
  mix: AudioMix;
  loudness: MixLoudness | undefined;
}): AudioMix {
  const { mix, loudness } = options;
  if (loudness === undefined) return mix;
  const { gainDecibels, isLimited } = levelingOf(loudness);
  const filters = [
    `volume=${String(gainDecibels)}dB`,
    ...(isLimited ? [limiter] : []),
  ].join(",");
  return {
    inputFiles: mix.inputFiles,
    filterGraph: `${mix.filterGraph};${mix.outputLabel}${filters}[leveled]`,
    outputLabel: "[leveled]",
  };
}
