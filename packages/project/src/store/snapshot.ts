import type { ProjectSnapshot, ProjectState } from "../format/state.js";

function deepFreeze(value: unknown): void {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return;
  }
  Object.freeze(value);
  const children: unknown[] = Object.values(value);
  for (const child of children) {
    deepFreeze(child);
  }
}

export function snapshotOf(options: {
  state: ProjectState;
  revision: number;
}): ProjectSnapshot {
  const { state, revision } = options;
  const snapshot: ProjectSnapshot = {
    revision,
    project: state.project,
    script: state.script,
    bible: state.bible,
    scenes: state.scenes,
    sceneCode: state.sceneCode,
    timelines: state.timelines,
    assets: state.assets,
  };
  deepFreeze(snapshot);
  deepFreeze(state);
  return snapshot;
}
