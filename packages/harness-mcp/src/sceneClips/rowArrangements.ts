import type { SceneClip } from "@yumekit/project";

export function resizedRow(options: {
  clips: SceneClip[];
  clipIndex: number;
  durationFrames: number;
}): SceneClip[] {
  const { clips, clipIndex, durationFrames } = options;
  const resized = clips[clipIndex];
  if (resized === undefined) return clips;
  const shift = durationFrames - resized.durationFrames;
  return clips.map((...[clip, index]) =>
    index === clipIndex
      ? { ...clip, durationFrames }
      : index > clipIndex
        ? { ...clip, startFrame: clip.startFrame + shift }
        : clip,
  );
}

export function movedRow(options: {
  clips: SceneClip[];
  clipIndex: number;
  toIndex: number;
}): SceneClip[] {
  const { clips, clipIndex, toIndex } = options;
  const [first] = clips;
  const moved = clips[clipIndex];
  if (first === undefined || moved === undefined || clipIndex === toIndex) {
    return clips;
  }
  const others = clips.filter((...[, index]) => index !== clipIndex);
  const order = [...others.slice(0, toIndex), moved, ...others.slice(toIndex)];
  let startFrame = first.startFrame;
  return order.map((clip) => {
    const packed = { ...clip, startFrame };
    startFrame += clip.durationFrames;
    return packed;
  });
}

export function rowWithout(options: {
  clips: SceneClip[];
  clipIndex: number;
}): SceneClip[] {
  const { clips, clipIndex } = options;
  const removed = clips[clipIndex];
  if (removed === undefined) return clips;
  return clips.flatMap((...[clip, index]) =>
    index === clipIndex
      ? []
      : index > clipIndex
        ? [{ ...clip, startFrame: clip.startFrame - removed.durationFrames }]
        : [clip],
  );
}

export function rowWithCopy(options: {
  clips: SceneClip[];
  clipIndex: number;
  copy: { clipId: string; sceneId: string };
}): SceneClip[] {
  const { clips, clipIndex, copy } = options;
  const original = clips[clipIndex];
  if (original === undefined) return clips;
  const copied = {
    ...original,
    id: copy.clipId,
    sceneId: copy.sceneId,
    startFrame: original.startFrame + original.durationFrames,
  };
  const shifted = clips.map((...[clip, index]) =>
    index > clipIndex
      ? { ...clip, startFrame: clip.startFrame + original.durationFrames }
      : clip,
  );
  return [
    ...shifted.slice(0, clipIndex + 1),
    copied,
    ...shifted.slice(clipIndex + 1),
  ];
}
