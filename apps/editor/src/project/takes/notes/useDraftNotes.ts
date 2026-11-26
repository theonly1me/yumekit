import { useSyncExternalStore } from "react";
import {
  emptyDraft,
  type DraftNote,
  type NotePlace,
  type TakeDraft,
} from "./draftNotes.js";

export interface TakeNotes {
  draft: TakeDraft;
  add: (note: { itemId: string; place: NotePlace; text: string }) => string;
  write: (change: { noteId: string; text: string }) => void;
  remove: (noteId: string) => void;
  toggleDropped: (itemId: string) => void;
  clear: () => void;
}

const store: {
  drafts: ReadonlyMap<string, TakeDraft>;
  listeners: Set<() => void>;
} = { drafts: new Map(), listeners: new Set() };

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function change(options: {
  takeId: string;
  next: (draft: TakeDraft) => TakeDraft;
}): void {
  const updated = new Map(store.drafts);
  updated.set(
    options.takeId,
    options.next(store.drafts.get(options.takeId) ?? emptyDraft),
  );
  store.drafts = updated;
  for (const listener of store.listeners) listener();
}

function notesWith(options: { takeId: string; draft: TakeDraft }): TakeNotes {
  const { takeId } = options;
  const edit = (next: (draft: TakeDraft) => TakeDraft) => {
    change({ takeId, next });
  };
  return {
    draft: options.draft,
    add: (note) => {
      const added: DraftNote = { id: crypto.randomUUID(), ...note };
      edit((draft) => ({ ...draft, notes: [...draft.notes, added] }));
      return added.id;
    },
    write: ({ noteId, text }) => {
      edit((draft) => ({
        ...draft,
        notes: draft.notes.map((note) =>
          note.id === noteId ? { ...note, text } : note,
        ),
      }));
    },
    remove: (noteId) => {
      edit((draft) => ({
        ...draft,
        notes: draft.notes.filter((note) => note.id !== noteId),
      }));
    },
    toggleDropped: (itemId) => {
      edit((draft) => ({
        ...draft,
        dropped: draft.dropped.includes(itemId)
          ? draft.dropped.filter((id) => id !== itemId)
          : [...draft.dropped, itemId],
      }));
    },
    clear: () => {
      edit(() => emptyDraft);
    },
  };
}

export function useTakeNotes(takeId: string | undefined): TakeNotes {
  const drafts = useSyncExternalStore(subscribe, () => store.drafts);
  const id = takeId ?? "";
  return notesWith({ takeId: id, draft: drafts.get(id) ?? emptyDraft });
}
