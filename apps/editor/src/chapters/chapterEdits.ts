import type { Chapter } from "@yumekit/project/takes";
import type { SceneEdits } from "../scenes/sceneEdits.js";
import type { DirectChanges } from "../scenes/useDirectChanges.js";
import {
  chapterMovedOf,
  filmOrderOf,
  joinedOf,
  lineMovedOf,
  renamedOf,
  sceneMovedOf,
  splitOf,
} from "./chapterMoves.js";
import type { ChapterCard, FilmChapters } from "./filmChapters.js";

export interface ChapterEdits {
  dropScene: (drop: { card: ChapterCard; onto: ChapterCard }) => void;
  dropSceneInChapter: (drop: { card: ChapterCard; chapterId: string }) => void;
  stepScene: (step: { card: ChapterCard; by: number }) => void;
  moveChapter: (move: { chapterId: string; toIndex: number }) => void;
  moveLine: (move: { leftId: string; firstShotId: string }) => void;
  rename: (change: { chapterId: string; title: string }) => void;
  split: (change: {
    chapterId: string;
    card: ChapterCard;
    sceneTitle: string;
  }) => void;
  join: (chapterId: string) => void;
}

export const noShotMessage =
  "This scene has no shot of the story, so it stays with the scene before it.";

function wireOf(chapters: Chapter[]) {
  return chapters.map((chapter) => ({
    chapter_id: chapter.id,
    title: chapter.title,
    shot_ids: chapter.shotIds,
  }));
}

export function chapterEditsOf(options: {
  changes: DirectChanges;
  film: FilmChapters;
  sceneEdits: SceneEdits;
}): ChapterEdits {
  const { changes, film, sceneEdits } = options;
  const order = () =>
    filmOrderOf({ chapters: film.chapters, cards: film.cards });
  const send = (chapters: Chapter[] | undefined) => {
    if (chapters === undefined) return;
    const wire = wireOf(chapters);
    if (JSON.stringify(wire) === JSON.stringify(wireOf(film.chapters))) return;
    changes
      .run({ area: "scenes", name: "set_chapters", input: { chapters: wire } })
      .catch(() => undefined);
  };
  const moveClip = (move: { card: ChapterCard; toIndex: number }) => {
    if (move.toIndex === move.card.index) return;
    sceneEdits.move({ clip: move.card.clip, toIndex: move.toIndex });
  };
  const shotFrom = (from: { card: ChapterCard; skipClipId: string }) =>
    film.cards
      .slice(from.card.index)
      .find(
        (each) =>
          each.chapterId === from.card.chapterId &&
          each.shotId !== undefined &&
          each.clip.id !== from.skipClipId,
      )?.shotId;
  return {
    dropScene: ({ card, onto }) => {
      if (card.clip.id === onto.clip.id) return;
      if (card.chapterId === onto.chapterId || card.shotId === undefined) {
        moveClip({ card, toIndex: onto.index });
        return;
      }
      send(
        sceneMovedOf({
          order: order(),
          shotId: card.shotId,
          chapterId: onto.chapterId,
          beforeShotId: shotFrom({ card: onto, skipClipId: card.clip.id }),
        }),
      );
    },
    dropSceneInChapter: ({ card, chapterId }) => {
      if (card.shotId !== undefined) {
        send(
          sceneMovedOf({
            order: order(),
            shotId: card.shotId,
            chapterId,
            beforeShotId: undefined,
          }),
        );
        return;
      }
      const last = film.cards.filter((each) => each.chapterId === chapterId);
      const lastCard = last.at(-1);
      if (lastCard === undefined) {
        changes.refuse({ area: "scenes", message: noShotMessage });
        return;
      }
      moveClip({
        card,
        toIndex:
          lastCard.index > card.index ? lastCard.index : lastCard.index + 1,
      });
    },
    stepScene: ({ card, by }) => {
      const neighbor = film.cards[card.index + by];
      if (neighbor === undefined) return;
      if (neighbor.chapterId === card.chapterId || card.shotId === undefined) {
        moveClip({ card, toIndex: neighbor.index });
        return;
      }
      const current = order();
      const target = current.find((each) => each.id === neighbor.chapterId);
      send(
        sceneMovedOf({
          order: current,
          shotId: card.shotId,
          chapterId: neighbor.chapterId,
          beforeShotId: by > 0 ? target?.shotIds[0] : undefined,
        }),
      );
    },
    moveChapter: ({ chapterId, toIndex }) => {
      send(chapterMovedOf({ order: order(), chapterId, toIndex }));
    },
    moveLine: ({ leftId, firstShotId }) => {
      send(lineMovedOf({ order: order(), leftId, firstShotId }));
    },
    rename: ({ chapterId, title }) => {
      send(renamedOf({ order: order(), chapterId, title }));
    },
    split: ({ chapterId, card, sceneTitle }) => {
      if (card.shotId === undefined) return;
      send(
        splitOf({
          order: order(),
          chapterId,
          shotId: card.shotId,
          title: `From ${sceneTitle}`.slice(0, 80),
        }),
      );
    },
    join: (chapterId) => {
      send(joinedOf({ order: order(), chapterId }));
    },
  };
}
