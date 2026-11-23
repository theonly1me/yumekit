import type { MadeBy, ProjectStore } from "@yumekit/project";

export function callerStore(options: {
  store: ProjectStore;
  callerOf: () => MadeBy | undefined;
}): ProjectStore {
  const { store, callerOf } = options;
  return {
    ...store,
    applyEdits: (edits) => store.applyChange({ edits, by: callerOf() }),
    applyChange: (change) => store.applyChange({ ...change, by: callerOf() }),
  };
}
