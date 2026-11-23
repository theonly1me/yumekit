import { AsyncLocalStorage } from "node:async_hooks";
import type { Outcome, ProjectStore } from "@yumekit/project";
import type { ChangeAuthor } from "./chatTypes.js";

export interface ToolCaller {
  by: ChangeAuthor;
  tool: string;
  summary?: string;
  actId?: string;
  changeId?: string;
}

export interface StoreCommit {
  kind: "edit" | "undo" | "redo";
  caller: ToolCaller | undefined;
}

export interface TrackedStore {
  store: ProjectStore;
  runCall: <Value>(options: {
    caller: ToolCaller;
    call: () => Promise<Value>;
  }) => Promise<Value>;
  onCommit: (listener: (commit: StoreCommit) => void) => void;
}

export function trackStore(store: ProjectStore): TrackedStore {
  const callers = new AsyncLocalStorage<ToolCaller>();
  let lastRevision = store.read().revision;
  let listener: (commit: StoreCommit) => void = () => undefined;
  const reportIfCommitted = <Failure>(options: {
    kind: StoreCommit["kind"];
    result: Outcome<{ revision: number }, Failure>;
  }) => {
    const { result } = options;
    if (!result.ok || result.value.revision <= lastRevision) return;
    lastRevision = result.value.revision;
    listener({ kind: options.kind, caller: callers.getStore() });
  };
  return {
    store: {
      ...store,
      applyEdits: async (edits) => {
        const result = await store.applyEdits(edits);
        reportIfCommitted({ kind: "edit", result });
        return result;
      },
      applyChange: async (change) => {
        const result = await store.applyChange(change);
        reportIfCommitted({ kind: "edit", result });
        return result;
      },
      undo: async () => {
        const result = await store.undo();
        reportIfCommitted({ kind: "undo", result });
        return result;
      },
      redo: async () => {
        const result = await store.redo();
        reportIfCommitted({ kind: "redo", result });
        return result;
      },
    },
    runCall: ({ caller, call }) => callers.run(caller, call),
    onCommit: (next) => {
      listener = next;
    },
  };
}
