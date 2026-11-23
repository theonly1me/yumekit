import {
  applyEditsToState,
  type Edit,
  type EditFailure,
} from "../edits/index.js";
import type { ProjectFiles } from "../folder/projectFiles.js";
import type { ProjectState } from "../format/state.js";
import type { MadeBy } from "../format/timeline.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { markWork, personWorkFailureOf } from "../personWork/index.js";

export interface ProjectChange {
  edits: Edit[];
  by?: MadeBy | undefined;
  keepPersonWork?: boolean;
}

export function haveSameContent(files: {
  before: ProjectFiles;
  after: ProjectFiles;
}): boolean {
  const { before, after } = files;
  return (
    before.size === after.size &&
    [...before].every(([file, content]) => after.get(file) === content)
  );
}

export async function changedState(options: {
  state: ProjectState;
  change: ProjectChange;
  folder: string;
}): Promise<Outcome<ProjectState, EditFailure>> {
  const { state, change } = options;
  const { edits } = change;
  const result = await applyEditsToState({
    state,
    edits,
    folder: options.folder,
  });
  if (!result.ok) return result;
  const next = markWork({ before: state, after: result.value, by: change.by });
  if (change.keepPersonWork !== true || change.by === "person") {
    return succeed(next);
  }
  const failure = personWorkFailureOf({
    before: state,
    after: next,
    editCount: edits.length,
  });
  return failure === undefined ? succeed(next) : fail(failure);
}
