export type NotePlace =
  | { kind: "pin"; x: number; y: number }
  | { kind: "moment"; seconds: number }
  | { kind: "quote"; quote: string }
  | { kind: "words" };

export interface DraftNote {
  id: string;
  itemId: string;
  place: NotePlace;
  text: string;
}

export interface TakeDraft {
  notes: DraftNote[];
  dropped: string[];
}

export interface SentNote {
  item_id: string;
  text: string;
  pin?: { x: number; y: number };
  seconds?: number;
  quote?: string;
  dropped?: true;
}

export const emptyDraft: TakeDraft = { notes: [], dropped: [] };

function placeFieldsOf(
  place: NotePlace,
): Pick<SentNote, "pin" | "seconds" | "quote"> {
  switch (place.kind) {
    case "pin":
      return { pin: { x: place.x, y: place.y } };
    case "moment":
      return { seconds: place.seconds };
    case "quote":
      return { quote: place.quote };
    case "words":
      return {};
  }
}

export function sentNotesOf(draft: TakeDraft): SentNote[] {
  const written = draft.notes
    .filter((note) => note.text.trim() !== "")
    .map((note) => ({
      item_id: note.itemId,
      text: note.text.trim(),
      ...placeFieldsOf(note.place),
    }));
  const dropped = draft.dropped.map((itemId): SentNote => ({
    item_id: itemId,
    text: "",
    dropped: true,
  }));
  return [...written, ...dropped];
}

export function noteCountOf(options: {
  draft: TakeDraft;
  itemId: string;
}): number {
  return sentNotesOf(options.draft).filter(
    (note) => note.item_id === options.itemId,
  ).length;
}

export function isDropped(options: {
  draft: TakeDraft;
  itemId: string;
}): boolean {
  return options.draft.dropped.includes(options.itemId);
}

export function notesOfItem(options: {
  draft: TakeDraft;
  itemId: string;
}): DraftNote[] {
  return options.draft.notes.filter((note) => note.itemId === options.itemId);
}

export function notesLabelOf(count: number): string {
  return `Send ${String(count)} ${count === 1 ? "note" : "notes"} to the lead`;
}
