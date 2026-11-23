import type {
  AudioClip,
  MadeBy,
  SceneClip,
  SceneTransition,
  Timeline,
  Track,
} from "../format/timeline.js";

export type Clip = SceneClip | AudioClip;

export function workKeyOf(clip: Clip): string {
  return "sceneId" in clip ? `scene:${clip.sceneId}` : `audio:${clip.assetId}`;
}

export function clipsOf(timeline: Timeline | undefined): Clip[] {
  return (timeline?.tracks ?? []).flatMap((track): Clip[] => track.clips);
}

export function sceneClipsOf(timeline: Timeline | undefined): SceneClip[] {
  return (timeline?.tracks ?? []).flatMap((track) =>
    track.kind === "scene" ? track.clips : [],
  );
}

export function haveSameTiming(options: {
  earlier: Clip;
  later: Clip;
}): boolean {
  const { earlier, later } = options;
  if (
    earlier.startFrame !== later.startFrame ||
    earlier.durationFrames !== later.durationFrames ||
    workKeyOf(earlier) !== workKeyOf(later)
  ) {
    return false;
  }
  if ("sceneId" in earlier && "sceneId" in later) {
    return earlier.sceneStartFrame === later.sceneStartFrame;
  }
  if ("assetId" in earlier && "assetId" in later) {
    return (
      earlier.assetStartFrame === later.assetStartFrame &&
      earlier.gainDecibels === later.gainDecibels
    );
  }
  return false;
}

export function haveSameTransition(options: {
  earlier: SceneTransition | undefined;
  later: SceneTransition | undefined;
}): boolean {
  const { earlier, later } = options;
  return (
    earlier?.kind === later?.kind &&
    earlier?.durationFrames === later?.durationFrames
  );
}

export function haveSameTrackState(options: {
  earlier: Track;
  later: Track;
}): boolean {
  const { earlier, later } = options;
  return (
    earlier.kind === later.kind &&
    (earlier.off === true) === (later.off === true)
  );
}

export function withMark<Value extends { madeBy?: MadeBy }>(options: {
  value: Value;
  mark: MadeBy | undefined;
}): Value {
  const { value, mark } = options;
  return mark === undefined ? value : { ...value, madeBy: mark };
}
