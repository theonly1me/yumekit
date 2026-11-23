import type {
  Output,
  Scene,
  SceneClip,
  Snapshot,
  Timeline,
} from "../engine/snapshot.js";

function sceneContentOf(options: { snapshot: Snapshot; scene: Scene }) {
  const { snapshot, scene } = options;
  const propsText = JSON.stringify(scene.source.props);
  return {
    source: scene.source,
    code: snapshot.sceneCode[scene.id] ?? null,
    assets: snapshot.assets.filter((asset) =>
      propsText.includes(JSON.stringify(asset.id)),
    ),
  };
}

function lookFactsOf(options: {
  snapshot: Snapshot;
  output: Output;
  scale: number;
}) {
  return {
    look: options.snapshot.project.look ?? "paper",
    framesPerSecond: options.snapshot.project.framesPerSecond,
    widthPixels: options.output.widthPixels,
    heightPixels: options.output.heightPixels,
    scale: options.scale,
  };
}

function relativeClipOf(options: { clip: SceneClip; frame: number }) {
  const { clip, frame } = options;
  return {
    sceneId: clip.sceneId,
    durationFrames: clip.durationFrames,
    sceneStartFrame: clip.sceneStartFrame,
    framesAfterStart: frame - clip.startFrame,
    transition: clip.transition ?? null,
  };
}

function clipsShownAt(options: { timeline: Timeline; frame: number }) {
  const { frame } = options;
  return options.timeline.tracks.flatMap((track) => {
    if (track.kind !== "scene" || track.off === true) return [];
    const shown = track.clips.find(
      (clip) =>
        frame >= clip.startFrame &&
        frame < clip.startFrame + clip.durationFrames,
    );
    if (shown === undefined) return [];
    const before = track.clips
      .filter((clip) => clip.startFrame < shown.startFrame)
      .sort((...[first, second]) => second.startFrame - first.startFrame)
      .slice(0, shown.transition === undefined ? 0 : 1);
    return [[shown, ...before].map((clip) => relativeClipOf({ clip, frame }))];
  });
}

export function clipPictureKey(options: {
  snapshot: Snapshot;
  timeline: Timeline;
  output: Output;
  scale: number;
  frame: number;
}): string {
  const { snapshot, frame } = options;
  const shownClips = clipsShownAt({ timeline: options.timeline, frame });
  const sceneIds = new Set(shownClips.flat().map((clip) => clip.sceneId));
  const scenes = snapshot.scenes
    .filter((scene) => sceneIds.has(scene.id))
    .map((scene) => ({ id: scene.id, ...sceneContentOf({ snapshot, scene }) }));
  return JSON.stringify({
    kind: "frame",
    ...lookFactsOf(options),
    shownClips,
    scenes,
  });
}

export function scenePictureKey(options: {
  snapshot: Snapshot;
  output: Output;
  scale: number;
  scene: Scene;
}): string {
  return JSON.stringify({
    kind: "scene",
    ...lookFactsOf(options),
    scene: sceneContentOf(options),
  });
}
