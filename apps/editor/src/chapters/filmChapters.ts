import {
  filmChapterId,
  filmChapterTitle,
  type Chapter,
} from "@yumekit/project/takes";
import type { SceneClip, Snapshot } from "../engine/snapshot.js";
import { chapterStepOf, type ChapterStep } from "./chapterSteps.js";

export interface ChapterCard {
  clip: SceneClip;
  index: number;
  shotId: string | undefined;
  chapterId: string;
}

export interface FilmChapter extends Chapter {
  number: number;
  cards: ChapterCard[];
  lengthFrames: number;
  plannedSeconds: number;
  step: ChapterStep;
}

export interface FilmChapters {
  chapters: FilmChapter[];
  cards: ChapterCard[];
  isSplit: boolean;
}

function shotIdOfClip(options: {
  snapshot: Snapshot;
  clip: SceneClip;
}): string | undefined {
  const { snapshot } = options;
  const scene = snapshot.scenes.find(
    (candidate) => candidate.id === options.clip.sceneId,
  );
  if (scene?.source.kind !== "kit") return undefined;
  if (scene.source.component !== "video-clip") return undefined;
  const assetId = scene.source.props["assetId"];
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  if (asset?.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

function sumOf(values: number[]): number {
  let sum = 0;
  for (const value of values) sum += value;
  return sum;
}

export function planChaptersOf(snapshot: Snapshot): Chapter[] {
  const plan = snapshot.bible.storyPlan;
  return (
    plan?.chapters ?? [
      {
        id: filmChapterId,
        title: filmChapterTitle,
        shotIds: (plan?.shots ?? []).map((shot) => shot.id),
      },
    ]
  );
}

function cardsOf(options: {
  snapshot: Snapshot;
  clips: SceneClip[];
  chapters: Chapter[];
}): ChapterCard[] {
  const { snapshot, chapters } = options;
  let chapterId = chapters[0]?.id ?? filmChapterId;
  return options.clips.map((...[clip, index]) => {
    const shotId = shotIdOfClip({ snapshot, clip });
    chapterId =
      chapters.find(
        (chapter) => shotId !== undefined && chapter.shotIds.includes(shotId),
      )?.id ?? chapterId;
    return { clip, index, shotId, chapterId };
  });
}

export function filmChaptersOf(options: {
  snapshot: Snapshot;
  clips: SceneClip[];
}): FilmChapters {
  const { snapshot } = options;
  const planned = planChaptersOf(snapshot);
  const cards = cardsOf({ ...options, chapters: planned });
  const shots = snapshot.bible.storyPlan?.shots ?? [];
  const chapters = planned.map((...[chapter, index]): FilmChapter => {
    const own = cards.filter((card) => card.chapterId === chapter.id);
    return {
      ...chapter,
      number: index + 1,
      cards: own,
      lengthFrames: sumOf(own.map((card) => card.clip.durationFrames)),
      plannedSeconds: sumOf(
        shots
          .filter((shot) => chapter.shotIds.includes(shot.id))
          .map((shot) => shot.seconds),
      ),
      step: chapterStepOf({
        takes: snapshot.takes ?? [],
        chapterId: chapter.id,
      }),
    };
  });
  return { chapters, cards, isSplit: chapters.length > 1 };
}
