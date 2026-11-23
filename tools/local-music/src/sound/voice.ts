import type { Note } from "../compose/score.ts";
import { sampleRate } from "../compose/timing.ts";

export interface VoiceTarget {
  left: Float32Array;
  right: Float32Array;
}

export interface VoiceRequest {
  note: Note;
  target: VoiceTarget;
  pan: number;
}

export type Voice = (request: VoiceRequest) => void;

export const tau = Math.PI * 2;

export function hertzOf(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

export function riseCurve(share: number): number {
  const clamped = Math.min(1, Math.max(0, share));
  return Math.sin((clamped * Math.PI) / 2) ** 2;
}

export function fallCurve(share: number): number {
  const clamped = Math.min(1, Math.max(0, share));
  return (1 - clamped) * Math.exp(-3 * clamped);
}

export function panGainsOf(pan: number): { left: number; right: number } {
  const angle = ((Math.min(1, Math.max(-1, pan)) + 1) * Math.PI) / 4;
  return {
    left: Math.cos(angle) * Math.SQRT2,
    right: Math.sin(angle) * Math.SQRT2,
  };
}

export function envelopeOf(options: {
  attackSeconds: number;
  lengthSeconds: number;
  releaseSeconds: number;
  decaySeconds?: number | undefined;
}): Float32Array {
  const { attackSeconds, lengthSeconds, releaseSeconds, decaySeconds } =
    options;
  const count = Math.ceil((lengthSeconds + releaseSeconds) * sampleRate);
  const envelope = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const seconds = index / sampleRate;
    const rise = riseCurve(seconds / attackSeconds);
    const fall =
      seconds < lengthSeconds
        ? 1
        : fallCurve((seconds - lengthSeconds) / releaseSeconds);
    const decay =
      decaySeconds === undefined ? 1 : Math.exp(-seconds / decaySeconds);
    envelope[index] = rise * fall * decay;
  }
  return envelope;
}

export function writeMono(options: {
  request: VoiceRequest;
  samples: Float32Array;
}): void {
  const { request, samples } = options;
  const { left, right } = request.target;
  const gains = panGainsOf(request.pan);
  const start = Math.round(request.note.startSeconds * sampleRate);
  const end = Math.min(left.length, start + samples.length);
  for (let index = start; index < end; index += 1) {
    const value = samples[index - start] ?? 0;
    left[index] = (left[index] ?? 0) + value * gains.left;
    right[index] = (right[index] ?? 0) + value * gains.right;
  }
}
