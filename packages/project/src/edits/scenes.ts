import type { Scene } from "../format/scene.js";
import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

function withoutSceneCode(options: {
  sceneCode: ProjectState["sceneCode"];
  sceneId: string;
}): ProjectState["sceneCode"] {
  return Object.fromEntries(
    Object.entries(options.sceneCode).filter(
      ([sceneId]) => sceneId !== options.sceneId,
    ),
  );
}

function sortedById(scenes: Scene[]): Scene[] {
  const sceneIds = scenes.map((scene) => scene.id).toSorted();
  return sceneIds.flatMap((sceneId) =>
    scenes.filter((scene) => scene.id === sceneId),
  );
}

export function putScene(options: {
  state: ProjectState;
  edit: EditOfKind<"putScene">;
}): EditResult {
  const { state, edit } = options;
  if (edit.scene.source.kind === "module" && edit.code === undefined) {
    return problem({
      kind: "invalid-value",
      message: `The module scene "${edit.scene.id}" needs code.`,
    });
  }
  if (edit.scene.source.kind === "kit" && edit.code !== undefined) {
    return problem({
      kind: "invalid-value",
      message: `The kit scene "${edit.scene.id}" cannot have code. Only a module scene has code.`,
    });
  }
  const otherScenes = state.scenes.filter(
    (scene) => scene.id !== edit.scene.id,
  );
  const sceneCode = withoutSceneCode({
    sceneCode: state.sceneCode,
    sceneId: edit.scene.id,
  });
  return succeed({
    ...state,
    scenes: sortedById([...otherScenes, edit.scene]),
    sceneCode:
      edit.code === undefined
        ? sceneCode
        : { ...sceneCode, [edit.scene.id]: edit.code },
  });
}

export function removeScene(options: {
  state: ProjectState;
  edit: EditOfKind<"removeScene">;
}): EditResult {
  const { state, edit } = options;
  if (!state.scenes.some((scene) => scene.id === edit.sceneId)) {
    return problem({
      kind: "not-found",
      message: `The scene "${edit.sceneId}" does not exist.`,
    });
  }
  const references = state.timelines.flatMap((timeline) =>
    timeline.tracks.flatMap((track) =>
      track.kind === "scene"
        ? track.clips
            .filter((clip) => clip.sceneId === edit.sceneId)
            .map(
              (clip) => `clip "${clip.id}" in timeline "${timeline.outputId}"`,
            )
        : [],
    ),
  );
  if (references.length > 0) {
    return problem({
      kind: "still-referenced",
      message: `The scene "${edit.sceneId}" is still referenced by: ${references.join(", ")}.`,
    });
  }
  return succeed({
    ...state,
    scenes: state.scenes.filter((scene) => scene.id !== edit.sceneId),
    sceneCode: withoutSceneCode({
      sceneCode: state.sceneCode,
      sceneId: edit.sceneId,
    }),
  });
}
