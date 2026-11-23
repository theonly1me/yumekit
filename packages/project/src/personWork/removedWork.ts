import { assetLabelOf } from "../assetLabels/index.js";
import type { ProjectState } from "../format/state.js";
import type { AudioClip, SceneClip, Timeline } from "../format/timeline.js";
import { isCaptionScene, scenesRowOf } from "../scenesRow/index.js";
import { clipsOf, sceneClipsOf, workKeyOf, type Clip } from "./clipFacts.js";

const videoClipComponent = "video-clip";
const voiceTrackPattern = /^(narration|voice)(-\d+)?$/;
const soundsTrackPattern = /^sounds(-\d+)?$/;

function isKept(options: { clip: Clip; after: Timeline | undefined }): boolean {
  const key = workKeyOf(options.clip);
  return clipsOf(options.after).some((clip) => workKeyOf(clip) === key);
}

function isTransitionKept(options: {
  clip: SceneClip;
  after: Timeline | undefined;
}): boolean {
  const { clip } = options;
  return sceneClipsOf(options.after).some(
    (later) =>
      (later.id === clip.id || later.startFrame === clip.startFrame) &&
      later.transition?.kind === clip.transition?.kind,
  );
}

function sceneClipName(options: {
  clip: SceneClip;
  timeline: Timeline;
  state: ProjectState;
}): string {
  const { clip, timeline, state } = options;
  const scene = state.scenes.find((candidate) => candidate.id === clip.sceneId);
  if (isCaptionScene(scene)) return "the captions";
  const row = scenesRowOf({ tracks: timeline.tracks, scenes: state.scenes });
  const place =
    [...(row?.clips ?? [])]
      .sort((...[first, second]) => first.startFrame - second.startFrame)
      .findIndex((candidate) => candidate.id === clip.id) + 1;
  const isVideo =
    scene?.source.kind === "kit" &&
    scene.source.component === videoClipComponent;
  const where =
    place > 0 ? `scene ${String(place)}` : `"${scene?.title ?? clip.sceneId}"`;
  return isVideo
    ? `the video clip of ${where}`
    : `${where}, which the person made`;
}

function audioClipName(options: {
  clip: AudioClip;
  trackId: string;
  state: ProjectState;
}): string {
  const { clip, trackId, state } = options;
  const asset = state.assets.find((candidate) => candidate.id === clip.assetId);
  const label = asset === undefined ? clip.assetId : assetLabelOf(asset);
  if (soundsTrackPattern.test(trackId)) return `the sound ${label}`;
  if (trackId === "video-sound") return `the sound of the video clip ${label}`;
  const isVoice =
    voiceTrackPattern.test(trackId) ||
    (asset?.source.kind === "tool" && asset.source.tool === "generate_speech");
  return isVoice ? `the voice ${label}` : `the music ${label}`;
}

function removedOfTimeline(options: {
  before: Timeline;
  after: Timeline | undefined;
  state: ProjectState;
}): { names: string[]; transitions: number } {
  const { before, after, state } = options;
  const names: string[] = [];
  let transitions = 0;
  for (const track of before.tracks) {
    for (const clip of track.clips) {
      if (clip.madeBy === "person" && !isKept({ clip, after })) {
        names.push(
          "sceneId" in clip
            ? sceneClipName({ clip, timeline: before, state })
            : audioClipName({ clip, trackId: track.id, state }),
        );
      }
      if (
        "sceneId" in clip &&
        clip.transition?.madeBy === "person" &&
        !isTransitionKept({ clip, after })
      ) {
        transitions += 1;
      }
    }
  }
  return { names, transitions };
}

export function removedPersonWork(options: {
  before: ProjectState;
  after: ProjectState;
}): string[] {
  const { before, after } = options;
  const names = new Set<string>();
  let transitions = 0;
  for (const timeline of before.timelines) {
    const removed = removedOfTimeline({
      before: timeline,
      after: after.timelines.find(
        (candidate) => candidate.outputId === timeline.outputId,
      ),
      state: before,
    });
    for (const name of removed.names) names.add(name);
    transitions += removed.transitions;
  }
  if (transitions === 0) return [...names];
  return [
    ...names,
    transitions === 1 ? "1 transition" : `${String(transitions)} transitions`,
  ];
}

export function listOf(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1) ?? ""}`;
}
