import type { EditFailure } from "../edits/editFailure.js";
import type { ProjectState } from "../format/state.js";
import { listOf, removedPersonWork } from "./removedWork.js";

export { markWork } from "./markWork.js";

export const personWorkFailureKind = "would-remove-the-work-of-the-person";

export function personWorkFailureOf(options: {
  before: ProjectState;
  after: ProjectState;
  editCount: number;
}): EditFailure | undefined {
  const removed = removedPersonWork(options);
  if (removed.length === 0) return undefined;
  return {
    kind: personWorkFailureKind,
    editIndex: Math.max(0, options.editCount - 1),
    message: `This change would remove what the person made: ${listOf(removed)}.`,
    removed,
  };
}
