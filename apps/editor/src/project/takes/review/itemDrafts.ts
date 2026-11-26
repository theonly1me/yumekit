import type { DraftVerdict, ItemDraft } from "@yumekit/project/takes";

export type { DraftVerdict, ItemDraft };

export type MarkKind = "pins" | "moments" | "quotes";

export type DraftChange = (draft: ItemDraft) => ItemDraft;

export const emptyItemDraft: ItemDraft = {
  tags: [],
  note: "",
  pins: [],
  moments: [],
  quotes: [],
};

export function hasWords(draft: ItemDraft): boolean {
  return (
    draft.tags.length > 0 ||
    draft.note.trim() !== "" ||
    draft.pins.length > 0 ||
    draft.moments.length > 0 ||
    draft.quotes.length > 0
  );
}

export function verdictOfDraft(draft: ItemDraft): DraftVerdict | undefined {
  return draft.verdict ?? (hasWords(draft) ? "change" : undefined);
}

function withoutVerdict(draft: ItemDraft): ItemDraft {
  return {
    tags: draft.tags,
    note: draft.note,
    pins: draft.pins,
    moments: draft.moments,
    quotes: draft.quotes,
  };
}

function withChangeWhenOpen(draft: ItemDraft): ItemDraft {
  return draft.verdict === undefined ? { ...draft, verdict: "change" } : draft;
}

function part(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000;
}

export function pickVerdict(verdict: DraftVerdict): DraftChange {
  return (draft) => {
    if (draft.verdict === verdict) return withoutVerdict(draft);
    const picked = { ...draft, verdict };
    return verdict === "approved" ? picked : withoutUse(picked);
  };
}

export function withoutUse(draft: ItemDraft): ItemDraft {
  const { verdict } = draft;
  return verdict === undefined
    ? withoutVerdict(draft)
    : { ...withoutVerdict(draft), verdict };
}

export function toggleUse(draft: ItemDraft): ItemDraft {
  return draft.use === true
    ? withoutUse(draft)
    : { ...draft, verdict: "approved", use: true };
}

export function toggleTag(tag: string): DraftChange {
  return (draft) =>
    draft.tags.includes(tag)
      ? { ...draft, tags: draft.tags.filter((each) => each !== tag) }
      : withChangeWhenOpen({ ...draft, tags: [...draft.tags, tag] });
}

export function writeNote(note: string): DraftChange {
  return (draft) =>
    note.trim() === ""
      ? { ...draft, note }
      : withChangeWhenOpen({ ...draft, note });
}

export function addPin(pin: { id: string; x: number; y: number }): DraftChange {
  return (draft) =>
    withChangeWhenOpen({
      ...draft,
      pins: [
        ...draft.pins,
        { id: pin.id, x: part(pin.x), y: part(pin.y), text: "" },
      ],
    });
}

export function addMoment(moment: {
  id: string;
  seconds: number;
}): DraftChange {
  const seconds = Math.round(Math.max(0, moment.seconds) * 10) / 10;
  return (draft) =>
    withChangeWhenOpen({
      ...draft,
      moments: [
        ...draft.moments,
        { id: moment.id, seconds, text: "" },
      ].toSorted((...[first, second]) => first.seconds - second.seconds),
    });
}

export function writeMark(mark: {
  kind: MarkKind;
  id: string;
  text: string;
}): DraftChange {
  return (draft) => {
    switch (mark.kind) {
      case "pins":
        return {
          ...draft,
          pins: draft.pins.map((pin) =>
            pin.id === mark.id ? { ...pin, text: mark.text } : pin,
          ),
        };
      case "moments":
        return {
          ...draft,
          moments: draft.moments.map((moment) =>
            moment.id === mark.id ? { ...moment, text: mark.text } : moment,
          ),
        };
      case "quotes":
        return {
          ...draft,
          quotes: draft.quotes.map((quote) =>
            quote.id === mark.id ? { ...quote, text: mark.text } : quote,
          ),
        };
    }
  };
}

export function removeMark(mark: { kind: MarkKind; id: string }): DraftChange {
  return (draft) => ({
    ...draft,
    pins: draft.pins.filter(
      (pin) => mark.kind !== "pins" || pin.id !== mark.id,
    ),
    moments: draft.moments.filter(
      (moment) => mark.kind !== "moments" || moment.id !== mark.id,
    ),
    quotes: draft.quotes.filter(
      (quote) => mark.kind !== "quotes" || quote.id !== mark.id,
    ),
  });
}

export function writeQuote(options: {
  id: string;
  quote: string;
  text: string;
}): DraftChange {
  return (draft) => {
    const isSame = (quote: { quote: string }) => quote.quote === options.quote;
    if (options.text.trim() === "") {
      const left = {
        ...draft,
        quotes: draft.quotes.filter((quote) => !isSame(quote)),
      };
      return hasWords(left) || left.verdict !== "change"
        ? left
        : withoutVerdict(left);
    }
    const quotes = draft.quotes.some(isSame)
      ? draft.quotes.map((quote) =>
          isSame(quote) ? { ...quote, text: options.text } : quote,
        )
      : [
          ...draft.quotes,
          { id: options.id, quote: options.quote, text: options.text },
        ];
    return withChangeWhenOpen({ ...draft, quotes });
  };
}
