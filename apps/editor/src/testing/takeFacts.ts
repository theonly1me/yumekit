import type { Take, TakeItem } from "../project/takes/takeTypes.js";

export function takeOf(fields: Partial<Take> & Pick<Take, "id">): Take {
  return {
    chapterId: "film",
    step: "pictures",
    number: 1,
    state: "ready",
    openedAt: "2026-11-26T10:00:00.000Z",
    items: [],
    notes: [],
    ...fields,
  };
}

export function assetItem(id: string): TakeItem {
  return { kind: "asset", id, note: `The picture ${id}.` };
}
