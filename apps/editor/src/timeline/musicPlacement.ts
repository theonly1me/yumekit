import type { Asset, AudioClip } from "../engine/snapshot.js";

export interface Placement {
  startFrame: number;
  durationFrames: number;
}

export interface MusicDraft extends Placement {
  clipId: string;
  baseClip: AudioClip;
  isDragging: boolean;
}

export function isSame(options: {
  first: Placement;
  second: Placement;
}): boolean {
  const { first, second } = options;
  return (
    first.startFrame === second.startFrame &&
    first.durationFrames === second.durationFrames
  );
}

export function limitsOf(options: {
  clip: AudioClip;
  from: Placement;
  assets: Asset[];
  endFrame: number;
  framesPerSecond: number;
}) {
  const { clip, from } = options;
  const asset = options.assets.find((each) => each.id === clip.assetId);
  const assetFrames = asset?.durationFrames ?? Number.POSITIVE_INFINITY;
  const lastEnd = Math.max(
    options.endFrame,
    clip.startFrame + clip.durationFrames,
    from.startFrame + from.durationFrames,
  );
  const clamp = (range: { value: number; low: number; high: number }) =>
    Math.min(range.high, Math.max(range.low, range.value));
  return {
    moved: (delta: number): Placement => ({
      startFrame: clamp({
        value: from.startFrame + delta,
        low: 0,
        high: lastEnd - from.durationFrames,
      }),
      durationFrames: from.durationFrames,
    }),
    trimmed: (delta: number): Placement => ({
      startFrame: from.startFrame,
      durationFrames: clamp({
        value: from.durationFrames + delta,
        low: Math.min(options.framesPerSecond, from.durationFrames),
        high: Math.min(
          assetFrames - clip.assetStartFrame,
          lastEnd - from.startFrame,
        ),
      }),
    }),
  };
}
