import type { ProjectState } from "../format/state.js";
import type { Outcome } from "../outcome.js";

export type EditFailureKind =
  | "id-in-use"
  | "not-found"
  | "still-referenced"
  | "clips-overlap"
  | "invalid-value"
  | "would-remove-the-work-of-the-person";

export interface EditFailure {
  kind: EditFailureKind;
  editIndex: number;
  message: string;
  removed?: string[];
}

export type EditProblem = Omit<EditFailure, "editIndex">;

export type EditResult = Outcome<ProjectState, EditProblem>;

export function problem(options: { kind: EditFailureKind; message: string }): {
  ok: false;
  failure: EditProblem;
} {
  return { ok: false, failure: options };
}
