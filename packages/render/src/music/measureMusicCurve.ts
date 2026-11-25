import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { findFfmpeg } from "../video/findFfmpeg.js";
import { musicHitsOf } from "./musicHits.js";

const runFile = promisify(execFile);

export const musicCurveStepSeconds = 0.5;

export const brightnessHertz = 2000;

const sampleRate = 16000;

const silentDecibels = -90;

const largestOutputBytes = 512 * 1024 * 1024;

export interface MusicCurve {
  stepSeconds: number;
  lengthSeconds: number;
  loudness: number[];
  brightness: number[];
  hits: number[];
}

async function samplesOf(options: {
  file: string;
  filter: string;
}): Promise<Float32Array | undefined> {
  try {
    const { stdout } = await runFile(
      "ffmpeg",
      [
        ...["-v", "error", "-i", options.file, "-vn"],
        ...["-af", options.filter, "-ac", "1", "-ar", String(sampleRate)],
        ...["-f", "f32le", "pipe:1"],
      ],
      { encoding: "buffer", maxBuffer: largestOutputBytes },
    );
    const copy = new Uint8Array(stdout);
    return new Float32Array(copy.buffer, 0, Math.floor(copy.length / 4));
  } catch {
    return undefined;
  }
}

function decibelsPerStep(samples: Float32Array): number[] {
  const size = Math.round(sampleRate * musicCurveStepSeconds);
  const steps: number[] = [];
  for (let start = 0; start + size / 2 <= samples.length; start += size) {
    let sum = 0;
    const end = Math.min(samples.length, start + size);
    for (let index = start; index < end; index += 1) {
      const value = samples[index] ?? 0;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / Math.max(1, end - start));
    steps.push(
      rms <= 0
        ? silentDecibels
        : Math.max(silentDecibels, Math.round(20 * Math.log10(rms) * 10) / 10),
    );
  }
  return steps;
}

export async function measureMusicCurve(
  file: string,
): Promise<Outcome<MusicCurve, RenderFailure>> {
  const missing = await findFfmpeg();
  if (missing !== undefined) return fail(missing);
  const [whole, high] = await Promise.all([
    samplesOf({ file, filter: "anull" }),
    samplesOf({ file, filter: `highpass=f=${String(brightnessHertz)}` }),
  ]);
  if (whole === undefined || high === undefined || whole.length === 0) {
    return fail({
      kind: "media-not-readable",
      file,
      message: `FFmpeg cannot read the sound of "${file}".`,
      hint: "Check that the file is a complete sound file.",
    });
  }
  return succeed({
    stepSeconds: musicCurveStepSeconds,
    lengthSeconds: Math.round((whole.length / sampleRate) * 100) / 100,
    loudness: decibelsPerStep(whole),
    brightness: decibelsPerStep(high),
    hits: musicHitsOf({ samples: whole, sampleRate }),
  });
}
