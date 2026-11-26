import {
  takeStepNames,
  type ProjectSnapshot,
  type Take,
  type TakeNote,
} from "@yumekit/project";

const assetWords = { image: "picture", video: "clip", audio: "sound" } as const;

function percent(part: number): string {
  return `${String(Math.round(part * 100))}%`;
}

function seconds(value: number): string {
  return `${String(Math.round(value * 10) / 10)} seconds`;
}

export function itemWordOf(options: {
  snapshot: ProjectSnapshot;
  itemId: string;
  take: Take;
}): string {
  const item = options.take.items.find(
    (candidate) => candidate.id === options.itemId,
  );
  if (item?.kind === "story") return "the story";
  if (item?.kind === "cut") return "the cut";
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === options.itemId,
  );
  const word =
    asset === undefined || asset.kind === "font"
      ? "item"
      : assetWords[asset.kind];
  return `${word} "${options.itemId}"`;
}

function placeOf(note: TakeNote): string {
  if (note.pin !== undefined) {
    return ` Pin at ${percent(note.pin.x)} from the left and ${percent(note.pin.y)} from the top.`;
  }
  if (note.seconds !== undefined) return ` At ${seconds(note.seconds)}.`;
  if (note.quote !== undefined) return ` On the words: "${note.quote}".`;
  return "";
}

export function noteLineOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
  note: TakeNote;
}): string {
  const { note } = options;
  const what = itemWordOf({ ...options, itemId: note.itemId });
  const dropped = note.dropped === true ? " Don't use this one." : "";
  const text = note.text === "" ? "" : ` "${note.text}"`;
  return `The ${what}:${dropped}${text}${placeOf(note)}`;
}

export function takeNameOf(take: Take): string {
  const chapter =
    take.chapterId === undefined ? "" : ` of chapter "${take.chapterId}"`;
  return `take ${String(take.number)} ("${take.id}", ${takeStepNames[take.step]}${chapter})`;
}

export function approvedIdsOf(take: Take): string[] {
  return take.items
    .filter((item) => item.approved === true)
    .map((item) => item.id);
}

export function countOf(options: { count: number; word: string }): string {
  return `${String(options.count)} ${options.word}${options.count === 1 ? "" : "s"}`;
}
