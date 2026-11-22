import type { SceneClip } from "../engine/snapshot.js";
import type { DirectChanges } from "./useDirectChanges.js";

export interface SceneEdits {
  resize: (change: { clip: SceneClip; durationFrames: number }) => void;
  move: (change: { clip: SceneClip; toIndex: number }) => void;
  duplicate: (clip: SceneClip) => void;
  remove: (clip: SceneClip) => void;
}

function runScenesChange(options: {
  changes: DirectChanges;
  name: string;
  input: object;
}) {
  return options.changes.run({
    area: "scenes",
    name: options.name,
    input: options.input,
  });
}

export function sceneEditsOf(options: {
  changes: DirectChanges;
  onPicked: (clipId: string | undefined) => void;
}): SceneEdits {
  const { changes, onPicked } = options;
  const keep = (change: Promise<unknown>) => {
    change.catch(() => undefined);
  };
  return {
    resize: ({ clip, durationFrames }) => {
      keep(
        runScenesChange({
          changes,
          name: "resize_scene_clip",
          input: { clip_id: clip.id, duration_frames: durationFrames },
        }),
      );
    },
    move: ({ clip, toIndex }) => {
      keep(
        runScenesChange({
          changes,
          name: "move_scene_clip",
          input: { clip_id: clip.id, to_index: toIndex },
        }),
      );
    },
    duplicate: (clip) => {
      keep(
        runScenesChange({
          changes,
          name: "duplicate_scene_clip",
          input: { clip_id: clip.id },
        }).then((outcome) => {
          const copyId =
            outcome.kind === "done" ? outcome.data["clip_id"] : undefined;
          if (typeof copyId === "string") onPicked(copyId);
        }),
      );
    },
    remove: (clip) => {
      keep(
        runScenesChange({
          changes,
          name: "remove_scene_clip",
          input: { clip_id: clip.id },
        }).then((outcome) => {
          if (outcome.kind === "done") onPicked(undefined);
        }),
      );
    },
  };
}
