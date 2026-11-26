import type { EngineClient } from "../../../engine/engineClient.js";
import { failureTextOf } from "../../../tools/requestText.js";
import { readDraft, saveDraft } from "./draftRequests.js";
import {
  emptyItemDraft,
  type DraftChange,
  type ItemDraft,
} from "./itemDrafts.js";

export type SaveState =
  | { kind: "waiting" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "failed"; message: string };

export interface DraftEntry {
  isLoaded: boolean;
  loadFailure: string | undefined;
  items: ReadonlyMap<string, ItemDraft>;
  saves: ReadonlyMap<string, SaveState>;
}

export const saveDelayMilliseconds = 600;

const store: {
  entries: ReadonlyMap<string, DraftEntry>;
  listeners: Set<() => void>;
} = { entries: new Map(), listeners: new Set() };

const timers = new Map<string, ReturnType<typeof setTimeout>>();

const flights = new Map<string, { again: boolean; done: Promise<void> }>();

export function subscribeToDrafts(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

export function draftEntries(): ReadonlyMap<string, DraftEntry> {
  return store.entries;
}

function put(options: { draftId: string; entry: DraftEntry }): void {
  const entries = new Map(store.entries);
  entries.set(options.draftId, options.entry);
  store.entries = entries;
  for (const listener of store.listeners) listener();
}

function keyOf(options: { draftId: string; itemId: string }): string {
  return `${options.draftId}/${options.itemId}`;
}

function setSave(options: {
  draftId: string;
  itemId: string;
  save: SaveState;
}): void {
  const entry = store.entries.get(options.draftId);
  if (entry === undefined) return;
  const saves = new Map(entry.saves);
  saves.set(options.itemId, options.save);
  put({ draftId: options.draftId, entry: { ...entry, saves } });
}

export function loadDraft(options: {
  client: EngineClient;
  draftId: string;
}): void {
  const { draftId } = options;
  if (store.entries.has(draftId)) return;
  const entry: DraftEntry = {
    isLoaded: false,
    loadFailure: undefined,
    items: new Map(),
    saves: new Map(),
  };
  put({ draftId, entry });
  readDraft(options)
    .then((reply) => {
      const current = store.entries.get(draftId);
      if (current === undefined) return;
      const items = new Map(reply.ok ? Object.entries(reply.value.items) : []);
      for (const [itemId, draft] of current.items) items.set(itemId, draft);
      const loadFailure = reply.ok ? undefined : failureTextOf(reply.failure);
      put({
        draftId,
        entry: { ...current, isLoaded: true, loadFailure, items },
      });
    })
    .catch(() => undefined);
}

export function saveItem(options: {
  client: EngineClient;
  draftId: string;
  itemId: string;
}): Promise<void> {
  const key = keyOf(options);
  const flying = flights.get(key);
  if (flying !== undefined) {
    flying.again = true;
    return flying.done;
  }
  const draft = store.entries.get(options.draftId)?.items.get(options.itemId);
  if (draft === undefined) return Promise.resolve();
  setSave({ ...options, save: { kind: "saving" } });
  const flight = { again: false, done: Promise.resolve() };
  flight.done = saveDraft({ ...options, draft }).then(async (reply) => {
    flights.delete(key);
    if (!store.entries.has(options.draftId)) return;
    if (flight.again) {
      await saveItem(options);
      return;
    }
    if (timers.has(key)) return;
    setSave({
      ...options,
      save: reply.ok
        ? { kind: "saved" }
        : { kind: "failed", message: failureTextOf(reply.failure) },
    });
  });
  flights.set(key, flight);
  return flight.done;
}

export function changeItem(options: {
  client: EngineClient;
  draftId: string;
  itemId: string;
  next: DraftChange;
}): void {
  const entry = store.entries.get(options.draftId);
  if (entry === undefined) return;
  const items = new Map(entry.items);
  items.set(
    options.itemId,
    options.next(entry.items.get(options.itemId) ?? emptyItemDraft),
  );
  const saves = new Map(entry.saves);
  saves.set(options.itemId, { kind: "waiting" });
  put({ draftId: options.draftId, entry: { ...entry, items, saves } });
  const key = keyOf(options);
  clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      saveItem(options).catch(() => undefined);
    }, saveDelayMilliseconds),
  );
}

function keysOfDraft(options: {
  draftId: string;
  keys: Iterable<string>;
}): string[] {
  return [...options.keys].filter((key) =>
    key.startsWith(`${options.draftId}/`),
  );
}

export async function flushDraft(options: {
  client: EngineClient;
  draftId: string;
}): Promise<void> {
  const waiting = keysOfDraft({ ...options, keys: timers.keys() }).map(
    (key) => {
      clearTimeout(timers.get(key));
      timers.delete(key);
      const itemId = key.slice(options.draftId.length + 1);
      return saveItem({ ...options, itemId });
    },
  );
  const flying = keysOfDraft({ ...options, keys: flights.keys() }).flatMap(
    (key) => {
      const flight = flights.get(key);
      return flight === undefined ? [] : [flight.done];
    },
  );
  await Promise.all([...waiting, ...flying]);
}

export function forgetDraft(draftId: string): void {
  for (const key of keysOfDraft({ draftId, keys: timers.keys() })) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  const entries = new Map(store.entries);
  entries.delete(draftId);
  store.entries = entries;
  for (const listener of store.listeners) listener();
}
