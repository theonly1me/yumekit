import { prettifyError } from "zod";
import type { ProjectState } from "../format/state.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { checkRules } from "../rules/index.js";
import { applyEdit } from "./applyEdit.js";
import { editSchema, type Edit } from "./edit.js";
import type { EditFailure } from "./editFailure.js";

export type { Edit } from "./edit.js";
export type { EditFailure } from "./editFailure.js";

export async function applyEditsToState(options: {
  state: ProjectState;
  edits: Edit[];
  folder: string;
}): Promise<Outcome<ProjectState, EditFailure>> {
  let state = options.state;
  for (const [editIndex, input] of options.edits.entries()) {
    const parsed = editSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        kind: "invalid-value",
        editIndex,
        message: prettifyError(parsed.error),
      });
    }
    const result = await applyEdit({
      state,
      edit: parsed.data,
      folder: options.folder,
    });
    if (!result.ok) {
      return fail({ ...result.failure, editIndex });
    }
    const ruleFailure = checkRules(result.value);
    if (ruleFailure !== undefined) {
      return fail({
        kind: ruleFailure.kind,
        editIndex,
        message: ruleFailure.message,
      });
    }
    state = result.value;
  }
  return succeed(state);
}
