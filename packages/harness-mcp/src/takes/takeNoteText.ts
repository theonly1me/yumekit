import {
  noteVerdictsOf,
  takeStepNames,
  type AssetVerdict,
  type ProjectSnapshot,
  type Take,
  type TakeNote,
} from "@yumekit/project";

const assetWords = { image: "picture", video: "clip", audio: "sound" } as const;

const verdictWords: Record<AssetVerdict, string> = {
  change: "has mistakes",
  dropped: "don't use this one",
  question: "the person is not sure",
  approved: "looks right",
};

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

function wordsOf(note: TakeNote): string {
  return note.text === "" ? "no words" : `"${note.text}"`;
}

function placeLinesOf(notes: TakeNote[]): string[] {
  let pinNumber = 0;
  return notes.flatMap((note) => {
    if (note.pin !== undefined) {
      pinNumber += 1;
      return [
        `Pin ${String(pinNumber)} at ${percent(note.pin.x)} from the left and ${percent(note.pin.y)} from the top: ${wordsOf(note)}`,
      ];
    }
    if (note.seconds !== undefined) {
      return [`At ${seconds(note.seconds)}: ${wordsOf(note)}`];
    }
    if (note.quote !== undefined) {
      return [`On the words "${note.quote}": ${wordsOf(note)}`];
    }
    return [];
  });
}

function isPlaced(note: TakeNote): boolean {
  return (
    note.pin !== undefined ||
    note.seconds !== undefined ||
    note.quote !== undefined
  );
}

function itemLinesOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
  itemId: string;
  verdict: AssetVerdict;
}): string[] {
  const own = options.take.notes.filter(
    (note) => note.itemId === options.itemId,
  );
  const general = own.filter((note) => !isPlaced(note));
  const tags = [...new Set(general.flatMap((note) => note.tags ?? []))];
  const words = general
    .filter((note) => note.text !== "")
    .map((note) => ` "${note.text}"`);
  const places = placeLinesOf(own);
  const isSilent =
    tags.length === 0 && words.length === 0 && places.length === 0;
  const silence =
    isSilent && (options.verdict === "change" || options.verdict === "question")
      ? " The person gave no words: look at it again, or ask."
      : "";
  const verdict = verdictWords[options.verdict];
  return [
    `The ${itemWordOf(options)}: ${verdict}.${tags.length === 0 ? "" : ` Tags: ${tags.join(", ")}.`}${words.join("")}${silence}`,
    ...places.map((line) => `   ${line}`),
  ];
}

function saysMoreThanAPick(options: { take: Take; itemId: string }): boolean {
  return options.take.notes.some(
    (note) =>
      note.itemId === options.itemId &&
      (note.use !== true ||
        note.text !== "" ||
        (note.tags ?? []).length > 0 ||
        isPlaced(note)),
  );
}

export function reviewLinesOf(options: {
  snapshot: ProjectSnapshot;
  take: Take;
}): string[] {
  return [...noteVerdictsOf(options.take.notes)]
    .filter(([itemId]) => saysMoreThanAPick({ take: options.take, itemId }))
    .flatMap((...[[itemId, verdict], index]) => {
      const [first = "", ...rest] = itemLinesOf({
        ...options,
        itemId,
        verdict,
      });
      return [`${String(index + 1)}. ${first}`, ...rest];
    });
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
