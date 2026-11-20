import {
  applyEditsToState,
  type Edit,
  type EditFailure,
} from "../edits/index.js";
import { filesSource } from "../folder/fileSources.js";
import { projectFilesOf, type ProjectFiles } from "../folder/projectFiles.js";
import { readState } from "../folder/readState.js";
import { syncFiles } from "../folder/syncFiles.js";
import type { WordTimings } from "../format/asset.js";
import type { ProjectSnapshot, ProjectState } from "../format/state.js";
import {
  deleteSteps,
  readStep,
  saveHistory,
  saveStep,
  stepsKept,
  type History,
} from "../history/history.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { createSerialQueue } from "./serialize.js";
import { snapshotOf } from "./snapshot.js";

export interface ProjectStore {
  folder: string;
  read: () => ProjectSnapshot;
  applyEdits: (
    edits: Edit[],
  ) => Promise<Outcome<{ revision: number }, EditFailure>>;
  undo: () => Promise<Outcome<{ revision: number }, "nothing-to-undo">>;
  redo: () => Promise<Outcome<{ revision: number }, "nothing-to-redo">>;
  readAssetWords: (
    assetId: string,
  ) => Promise<Outcome<WordTimings, "not-found">>;
  subscribe: (listener: (snapshot: ProjectSnapshot) => void) => () => void;
}

function haveSameContent(files: {
  before: ProjectFiles;
  after: ProjectFiles;
}): boolean {
  const { before, after } = files;
  return (
    before.size === after.size &&
    [...before].every(([file, content]) => after.get(file) === content)
  );
}

export function createProjectStore(options: {
  folder: string;
  state: ProjectState;
  history: History;
}): ProjectStore {
  const { folder } = options;
  let state = options.state;
  let files = projectFilesOf(state);
  let history = options.history;
  let snapshot = snapshotOf({ state, revision: history.revision });
  const listeners = new Set<(snapshot: ProjectSnapshot) => void>();
  const serialize = createSerialQueue();

  async function commit(change: {
    state: ProjectState;
    undoSteps: string[];
    redoSteps: string[];
  }): Promise<{ revision: number }> {
    const nextFiles = projectFilesOf(change.state);
    await syncFiles({ folder, previous: files, next: nextFiles });
    const nextHistory = {
      revision: history.revision + 1,
      undoSteps: change.undoSteps,
      redoSteps: change.redoSteps,
    };
    await saveHistory({ folder, history: nextHistory });
    state = change.state;
    files = nextFiles;
    history = nextHistory;
    snapshot = snapshotOf({ state, revision: history.revision });
    for (const listener of listeners) {
      listener(snapshot);
    }
    return { revision: history.revision };
  }

  async function stateOfStep(stepId: string): Promise<ProjectState> {
    const stepState = await readState(
      filesSource(await readStep({ folder, stepId })),
    );
    if (!stepState.ok) {
      throw new Error(
        `The undo step ${stepId} is not a valid project: ${stepState.failure.message}`,
      );
    }
    return stepState.value;
  }

  async function applyEdits(
    edits: Edit[],
  ): Promise<Outcome<{ revision: number }, EditFailure>> {
    const result = await applyEditsToState({ state, edits, folder });
    if (!result.ok) {
      return result;
    }
    if (
      haveSameContent({ before: files, after: projectFilesOf(result.value) })
    ) {
      return succeed({ revision: history.revision });
    }
    const stepId = await saveStep({ folder, files });
    const undoSteps = [...history.undoSteps, stepId];
    const droppedSteps = [
      ...undoSteps.slice(0, -stepsKept),
      ...history.redoSteps,
    ];
    const committed = await commit({
      state: result.value,
      undoSteps: undoSteps.slice(-stepsKept),
      redoSteps: [],
    });
    await deleteSteps({ folder, stepIds: droppedSteps });
    return succeed(committed);
  }

  async function undo(): Promise<
    Outcome<{ revision: number }, "nothing-to-undo">
  > {
    const stepId = history.undoSteps.at(-1);
    if (stepId === undefined) {
      return fail("nothing-to-undo");
    }
    const redoStepId = await saveStep({ folder, files });
    const committed = await commit({
      state: await stateOfStep(stepId),
      undoSteps: history.undoSteps.slice(0, -1),
      redoSteps: [...history.redoSteps, redoStepId],
    });
    await deleteSteps({ folder, stepIds: [stepId] });
    return succeed(committed);
  }

  async function redo(): Promise<
    Outcome<{ revision: number }, "nothing-to-redo">
  > {
    const stepId = history.redoSteps.at(-1);
    if (stepId === undefined) {
      return fail("nothing-to-redo");
    }
    const undoStepId = await saveStep({ folder, files });
    const undoSteps = [...history.undoSteps, undoStepId];
    const committed = await commit({
      state: await stateOfStep(stepId),
      undoSteps: undoSteps.slice(-stepsKept),
      redoSteps: history.redoSteps.slice(0, -1),
    });
    await deleteSteps({
      folder,
      stepIds: [stepId, ...undoSteps.slice(0, -stepsKept)],
    });
    return succeed(committed);
  }

  return {
    folder,
    read: () => snapshot,
    applyEdits: (edits) => serialize(() => applyEdits(edits)),
    undo: () => serialize(undo),
    redo: () => serialize(redo),
    readAssetWords: (assetId) => {
      const words = Object.entries(state.words).find(
        ([wordsAssetId]) => wordsAssetId === assetId,
      );
      return Promise.resolve(
        words === undefined ? fail("not-found") : succeed(words[1]),
      );
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
