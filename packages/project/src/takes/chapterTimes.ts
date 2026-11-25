import type { Asset } from "../format/asset.js";
import type { Bible } from "../format/bible.js";
import type { Scene } from "../format/scene.js";
import type { SceneClip, Timeline } from "../format/timeline.js";
import { scenesRowOf } from "../scenesRow/index.js";
import { chapterIdOfShot, chaptersOf, filmChapterId } from "./chapters.js";

export interface ChapterWork {
  bible: Pick<Bible, "storyPlan">;
  scenes: readonly Scene[];
  assets: readonly Asset[];
  timelines: readonly Timeline[];
}

export const videoClipComponent = "video-clip";

function shotIdOfScene(options: {
  scene: Scene | undefined;
  assets: readonly Asset[];
}): string | undefined {
  const { scene } = options;
  if (scene?.source.kind !== "kit") return undefined;
  if (scene.source.component !== videoClipComponent) return undefined;
  const assetId = scene.source.props["assetId"];
  const asset = options.assets.find((candidate) => candidate.id === assetId);
  if (asset?.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

function rowClipsOf(options: {
  work: ChapterWork;
  outputId: string;
}): SceneClip[] {
  const timeline = options.work.timelines.find(
    (candidate) => candidate.outputId === options.outputId,
  );
  if (timeline === undefined) return [];
  const row = scenesRowOf({
    tracks: timeline.tracks,
    scenes: options.work.scenes,
  });
  return (row?.clips ?? []).toSorted(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
}

export function chapterIdsOfClips(options: {
  work: ChapterWork;
  outputId: string;
}): Map<string, string> {
  const { work } = options;
  const plan = work.bible.storyPlan;
  let current = chaptersOf(plan)[0]?.id ?? filmChapterId;
  const chapterIds = new Map<string, string>();
  for (const clip of rowClipsOf(options)) {
    const shotId = shotIdOfScene({
      scene: work.scenes.find((scene) => scene.id === clip.sceneId),
      assets: work.assets,
    });
    current =
      (shotId === undefined ? undefined : chapterIdOfShot({ plan, shotId })) ??
      current;
    chapterIds.set(clip.id, current);
  }
  return chapterIds;
}

export function chapterFramesOf(options: {
  work: ChapterWork;
  outputId: string;
  chapterId: string;
}): { firstFrame: number; frameCount: number } | undefined {
  const chapterIds = chapterIdsOfClips(options);
  const clips = rowClipsOf(options).filter(
    (clip) => chapterIds.get(clip.id) === options.chapterId,
  );
  if (clips.length === 0) return undefined;
  const firstFrame = Math.min(...clips.map((clip) => clip.startFrame));
  const endFrame = Math.max(
    ...clips.map((clip) => clip.startFrame + clip.durationFrames),
  );
  return { firstFrame, frameCount: endFrame - firstFrame };
}
