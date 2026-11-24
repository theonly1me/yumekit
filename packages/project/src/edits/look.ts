import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import type { EditResult } from "./editFailure.js";

export function setLook(options: {
  state: ProjectState;
  edit: EditOfKind<"setLook">;
}): EditResult {
  const { state, edit } = options;
  const { lookColors, lookFont, ...project } = state.project;
  const colors = edit.colors === undefined ? lookColors : edit.colors;
  const font = edit.font === undefined ? lookFont : edit.font;
  return succeed({
    ...state,
    project: {
      ...project,
      look: edit.look,
      ...(edit.calm === undefined ? {} : { calm: edit.calm }),
      ...(colors === undefined || colors === null
        ? {}
        : { lookColors: colors }),
      ...(font === undefined || font === null ? {} : { lookFont: font }),
    },
  });
}
