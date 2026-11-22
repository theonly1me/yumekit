import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import type { EditResult } from "./editFailure.js";

export function setLook(options: {
  state: ProjectState;
  edit: EditOfKind<"setLook">;
}): EditResult {
  const { state, edit } = options;
  return succeed({ ...state, project: { ...state.project, look: edit.look } });
}
