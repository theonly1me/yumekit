import { noReviewCounts, type ReviewCounts } from "@yumekit/project/takes";
import {
  verdictOfDraft,
  type DraftVerdict,
  type ItemDraft,
} from "./itemDrafts.js";

export interface SentNote {
  item_id: string;
  text: string;
  pin?: { x: number; y: number };
  seconds?: number;
  quote?: string;
  tags?: string[];
  dropped?: true;
  question?: true;
  approved?: true;
  use?: true;
}

type VerdictFields = Pick<SentNote, "dropped" | "question" | "approved">;

function verdictFieldsOf(verdict: DraftVerdict): VerdictFields {
  switch (verdict) {
    case "approved":
      return { approved: true };
    case "question":
      return { question: true };
    case "dropped":
      return { dropped: true };
    case "change":
      return {};
  }
}

export function itemNotesOf(options: {
  itemId: string;
  draft: ItemDraft;
}): SentNote[] {
  const { draft } = options;
  const verdict = verdictOfDraft(draft);
  if (verdict === undefined) return [];
  const base = { item_id: options.itemId, ...verdictFieldsOf(verdict) };
  const marks: SentNote[] = [
    ...draft.pins.map((pin) => ({
      ...base,
      text: pin.text.trim(),
      pin: { x: pin.x, y: pin.y },
    })),
    ...draft.moments.map((moment) => ({
      ...base,
      text: moment.text.trim(),
      seconds: moment.seconds,
    })),
    ...draft.quotes
      .filter((quote) => quote.text.trim() !== "")
      .map((quote) => ({
        ...base,
        text: quote.text.trim(),
        quote: quote.quote,
      })),
  ];
  const note = draft.note.trim();
  const isUsed = verdict === "approved" && draft.use === true;
  const isSilent = marks.length === 0 && verdict !== "approved";
  const hasGeneral = note !== "" || draft.tags.length > 0 || isSilent || isUsed;
  const general: SentNote[] = hasGeneral
    ? [
        {
          ...base,
          text: note,
          ...(draft.tags.length === 0 ? {} : { tags: draft.tags }),
          ...(isUsed ? ({ use: true } as const) : {}),
        },
      ]
    : [];
  return [...general, ...marks];
}

export function sentNotesOf(options: {
  drafts: ReadonlyMap<string, ItemDraft>;
  itemIds: readonly string[];
}): SentNote[] {
  return options.itemIds.flatMap((itemId) => {
    const draft = options.drafts.get(itemId);
    return draft === undefined ? [] : itemNotesOf({ itemId, draft });
  });
}

export function draftCountsOf(options: {
  drafts: ReadonlyMap<string, ItemDraft>;
  itemIds: readonly string[];
}): ReviewCounts {
  const counts = { ...noReviewCounts };
  for (const itemId of options.itemIds) {
    const draft = options.drafts.get(itemId);
    const verdict = draft === undefined ? undefined : verdictOfDraft(draft);
    if (verdict !== undefined && verdict !== "approved") counts[verdict] += 1;
    if (verdict === "approved" && draft?.use === true) counts.use += 1;
  }
  return counts;
}
