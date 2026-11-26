import type { Chapter } from "@yumekit/project/takes";
import type { ChapterCard } from "./filmChapters.js";

type Order = Chapter[];

function withoutEmpty(order: Order): Order {
  return order.filter((chapter) => chapter.shotIds.length > 0);
}

export function filmOrderOf(options: {
  chapters: Order;
  cards: ChapterCard[];
}): Order {
  return options.chapters.map((chapter) => {
    const inRow = [
      ...new Set(
        options.cards.flatMap((card) =>
          card.shotId !== undefined && chapter.shotIds.includes(card.shotId)
            ? [card.shotId]
            : [],
        ),
      ),
    ];
    let next = 0;
    const shotIds = chapter.shotIds.map((shotId) => {
      if (!inRow.includes(shotId)) return shotId;
      const filled = inRow[next] ?? shotId;
      next += 1;
      return filled;
    });
    return { ...chapter, shotIds };
  });
}

export function sceneMovedOf(options: {
  order: Order;
  shotId: string;
  chapterId: string;
  beforeShotId: string | undefined;
}): Order | undefined {
  const { shotId, beforeShotId } = options;
  const removed = options.order.map((chapter) => ({
    ...chapter,
    shotIds: chapter.shotIds.filter((each) => each !== shotId),
  }));
  const target = removed.find((chapter) => chapter.id === options.chapterId);
  if (target === undefined || shotId === beforeShotId) return undefined;
  const at =
    beforeShotId === undefined ? -1 : target.shotIds.indexOf(beforeShotId);
  target.shotIds.splice(at === -1 ? target.shotIds.length : at, 0, shotId);
  return withoutEmpty(removed);
}

export function chapterMovedOf(options: {
  order: Order;
  chapterId: string;
  toIndex: number;
}): Order | undefined {
  const { order, toIndex } = options;
  const moved = order.find((chapter) => chapter.id === options.chapterId);
  if (moved === undefined || toIndex < 0 || toIndex >= order.length) {
    return undefined;
  }
  if (order.indexOf(moved) === toIndex) return undefined;
  const rest = order.filter((chapter) => chapter !== moved);
  rest.splice(toIndex, 0, moved);
  return rest;
}

export function lineMovedOf(options: {
  order: Order;
  leftId: string;
  firstShotId: string;
}): Order | undefined {
  const { order } = options;
  const leftIndex = order.findIndex((chapter) => chapter.id === options.leftId);
  const left = order[leftIndex];
  const right = order[leftIndex + 1];
  if (left === undefined || right === undefined) return undefined;
  const pair = [...left.shotIds, ...right.shotIds];
  const cut = pair.indexOf(options.firstShotId);
  if (cut <= 0 || cut === left.shotIds.length) return undefined;
  return order.map((chapter) =>
    chapter === left
      ? { ...left, shotIds: pair.slice(0, cut) }
      : chapter === right
        ? { ...right, shotIds: pair.slice(cut) }
        : chapter,
  );
}

export function renamedOf(options: {
  order: Order;
  chapterId: string;
  title: string;
}): Order | undefined {
  const title = options.title.trim().replace(/\s+/g, " ");
  const chapter = options.order.find((each) => each.id === options.chapterId);
  if (chapter === undefined || title === "" || title === chapter.title) {
    return undefined;
  }
  return options.order.map((each) =>
    each === chapter ? { ...each, title } : each,
  );
}

function newChapterIdOf(order: Order): string {
  const ids = order.map((chapter) => chapter.id);
  let number = order.length + 1;
  while (ids.includes(`chapter-${String(number)}`)) number += 1;
  return `chapter-${String(number)}`;
}

export function splitOf(options: {
  order: Order;
  chapterId: string;
  shotId: string;
  title: string;
}): Order | undefined {
  const { order } = options;
  const chapter = order.find((each) => each.id === options.chapterId);
  const cut = chapter?.shotIds.indexOf(options.shotId) ?? -1;
  if (chapter === undefined || cut <= 0) return undefined;
  const added = {
    id: newChapterIdOf(order),
    title: options.title,
    shotIds: chapter.shotIds.slice(cut),
  };
  return order.flatMap((each) =>
    each === chapter
      ? [{ ...chapter, shotIds: chapter.shotIds.slice(0, cut) }, added]
      : [each],
  );
}

export function joinedOf(options: {
  order: Order;
  chapterId: string;
}): Order | undefined {
  const { order } = options;
  const index = order.findIndex((chapter) => chapter.id === options.chapterId);
  const chapter = order[index];
  const next = order[index + 1];
  if (chapter === undefined || next === undefined) return undefined;
  return order.flatMap((each) =>
    each === next
      ? []
      : each === chapter
        ? [{ ...chapter, shotIds: [...chapter.shotIds, ...next.shotIds] }]
        : [each],
  );
}
