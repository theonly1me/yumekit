import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

export function setChapters(options: {
  state: ProjectState;
  edit: EditOfKind<"setChapters">;
}): EditResult {
  const { state, edit } = options;
  const plan = state.bible.storyPlan;
  if (plan === undefined) {
    return problem({
      kind: "not-found",
      message: "The project has no story plan, so it has no shots to split.",
    });
  }
  const storyPlan = { ...plan };
  delete storyPlan.chapters;
  return succeed({
    ...state,
    bible: {
      ...state.bible,
      storyPlan:
        edit.chapters.length === 0
          ? storyPlan
          : { ...storyPlan, chapters: edit.chapters },
    },
  });
}

export function setApprovePicturesFirst(options: {
  state: ProjectState;
  edit: EditOfKind<"setApprovePicturesFirst">;
}): EditResult {
  const { state, edit } = options;
  const project = { ...state.project };
  delete project.approvePicturesFirst;
  return succeed({
    ...state,
    project: edit.approvePicturesFirst
      ? project
      : { ...project, approvePicturesFirst: false },
  });
}
