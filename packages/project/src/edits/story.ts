import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

interface StoryEdit<
  Kind extends EditOfKind<
    "setProjectName" | "addOutput" | "removeOutput" | "setScript" | "setBible"
  >["kind"],
> {
  state: ProjectState;
  edit: EditOfKind<Kind>;
}

export function setProjectName(
  options: StoryEdit<"setProjectName">,
): EditResult {
  const { state, edit } = options;
  return succeed({ ...state, project: { ...state.project, name: edit.name } });
}

export function addOutput(options: StoryEdit<"addOutput">): EditResult {
  const { state, edit } = options;
  if (state.project.outputs.some((output) => output.id === edit.output.id)) {
    return problem({
      kind: "id-in-use",
      message: `The output "${edit.output.id}" already exists.`,
    });
  }
  return succeed({
    ...state,
    project: {
      ...state.project,
      outputs: [...state.project.outputs, edit.output],
    },
    timelines: [...state.timelines, { outputId: edit.output.id, tracks: [] }],
  });
}

export function removeOutput(options: StoryEdit<"removeOutput">): EditResult {
  const { state, edit } = options;
  if (!state.project.outputs.some((output) => output.id === edit.outputId)) {
    return problem({
      kind: "not-found",
      message: `The output "${edit.outputId}" does not exist.`,
    });
  }
  return succeed({
    ...state,
    project: {
      ...state.project,
      outputs: state.project.outputs.filter(
        (output) => output.id !== edit.outputId,
      ),
    },
    timelines: state.timelines.filter(
      (timeline) => timeline.outputId !== edit.outputId,
    ),
  });
}

export function setScript(options: StoryEdit<"setScript">): EditResult {
  return succeed({ ...options.state, script: options.edit.script });
}

export function setBible(options: StoryEdit<"setBible">): EditResult {
  return succeed({ ...options.state, bible: options.edit.bible });
}
