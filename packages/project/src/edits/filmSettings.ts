import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

export function setTempo(options: {
  state: ProjectState;
  edit: EditOfKind<"setTempo">;
}): EditResult {
  const { state, edit } = options;
  const project = { ...state.project };
  delete project.tempo;
  return succeed({
    ...state,
    project:
      edit.tempo === undefined ? project : { ...project, tempo: edit.tempo },
  });
}

export function setFonts(options: {
  state: ProjectState;
  edit: EditOfKind<"setFonts">;
}): EditResult {
  const { state, edit } = options;
  const project = { ...state.project };
  delete project.fonts;
  return succeed({
    ...state,
    project:
      edit.fonts.length === 0 ? project : { ...project, fonts: edit.fonts },
  });
}

export function putSharedCode(options: {
  state: ProjectState;
  edit: EditOfKind<"putSharedCode">;
}): EditResult {
  const { state, edit } = options;
  if (edit.code.trim() === "") {
    return problem({
      kind: "invalid-value",
      message: `The shared code "${edit.name}" is empty.`,
    });
  }
  return succeed({
    ...state,
    sharedCode: { ...state.sharedCode, [edit.name]: edit.code },
  });
}
