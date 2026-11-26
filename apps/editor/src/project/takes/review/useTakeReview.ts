import { useEffect, useSyncExternalStore } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import { removeDraft } from "./draftRequests.js";
import {
  changeItem,
  draftEntries,
  flushDraft,
  forgetDraft,
  loadDraft,
  saveItem,
  subscribeToDrafts,
  type SaveState,
} from "./draftStore.js";
import {
  emptyItemDraft,
  type DraftChange,
  type ItemDraft,
} from "./itemDrafts.js";

export type { SaveState };

export interface TakeReview {
  draftId: string | undefined;
  isLoaded: boolean;
  loadFailure: string | undefined;
  drafts: ReadonlyMap<string, ItemDraft>;
  draftOf: (itemId: string) => ItemDraft;
  saveOf: (itemId: string) => SaveState | undefined;
  change: (options: { itemId: string; next: DraftChange }) => void;
  saveAgain: (itemId: string) => void;
  flush: () => Promise<void>;
  forget: (options: { onEngine: boolean }) => Promise<void>;
}

const noDrafts: ReadonlyMap<string, ItemDraft> = new Map();

export function useTakeReview(options: {
  client: EngineClient;
  draftId: string | undefined;
}): TakeReview {
  const { client, draftId } = options;
  const entries = useSyncExternalStore(subscribeToDrafts, draftEntries);
  const entry = draftId === undefined ? undefined : entries.get(draftId);
  const isMissing = entry === undefined;

  useEffect(() => {
    if (draftId !== undefined && isMissing) loadDraft({ client, draftId });
  }, [client, draftId, isMissing]);

  const drafts = entry?.items ?? noDrafts;
  return {
    draftId,
    isLoaded: entry?.isLoaded ?? false,
    loadFailure: entry?.loadFailure,
    drafts,
    draftOf: (itemId) => drafts.get(itemId) ?? emptyItemDraft,
    saveOf: (itemId) => entry?.saves.get(itemId),
    change: ({ itemId, next }) => {
      if (draftId === undefined) return;
      changeItem({ client, draftId, itemId, next });
    },
    saveAgain: (itemId) => {
      if (draftId === undefined) return;
      saveItem({ client, draftId, itemId }).catch(() => undefined);
    },
    flush: () =>
      draftId === undefined
        ? Promise.resolve()
        : flushDraft({ client, draftId }),
    forget: async ({ onEngine }) => {
      if (draftId === undefined) return;
      await flushDraft({ client, draftId });
      if (onEngine) await removeDraft({ client, draftId });
      forgetDraft(draftId);
    },
  };
}
