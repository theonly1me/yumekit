import type { AudioClip, SceneClip } from "../engine/snapshot.js";
import type { ChangeArea, DirectChanges } from "../scenes/useDirectChanges.js";
import type { FilmChapters } from "../chapters/filmChapters.js";
import {
  chapterRefusalOf,
  placeCallOf,
  type TrayItem,
} from "../takeTray/trayItems.js";

export interface TimelineEdits {
  resizeScene: (change: {
    clip: SceneClip;
    durationFrames: number;
  }) => Promise<boolean>;
  changeMusic: (change: {
    clip: AudioClip;
    startFrame: number;
    durationFrames: number;
  }) => Promise<boolean>;
  placeItem: (drop: {
    item: TrayItem;
    clip: SceneClip | undefined;
    area: ChangeArea;
  }) => void;
}

export const pickSceneFirstMessage =
  "Pick a scene first, then press the picture or the clip again.";

export function timelineEditsOf(options: {
  changes: DirectChanges;
  outputId: string;
  film: FilmChapters;
}): TimelineEdits {
  const { changes, outputId, film } = options;
  const run = (call: { area: ChangeArea; name: string; input: object }) =>
    changes
      .run(call)
      .then((outcome) => outcome.kind === "done")
      .catch(() => false);
  return {
    resizeScene: ({ clip, durationFrames }) => {
      return run({
        area: "timeline",
        name: "resize_scene_clip",
        input: { clip_id: clip.id, duration_frames: durationFrames },
      });
    },
    changeMusic: ({ clip, startFrame, durationFrames }) =>
      run({
        area: "timeline",
        name: "update_clip",
        input: {
          output_id: outputId,
          clip_id: clip.id,
          start_frame: startFrame,
          duration_frames: durationFrames,
        },
      }),
    placeItem: ({ item, clip, area }) => {
      if (clip === undefined) {
        changes.refuse({ area, message: pickSceneFirstMessage });
        return;
      }
      const refusal = chapterRefusalOf({ item, clipId: clip.id, film });
      if (refusal !== undefined) {
        changes.refuse({ area, message: refusal });
        return;
      }
      run({ area, ...placeCallOf({ item, outputId, clipId: clip.id }) }).catch(
        () => undefined,
      );
    },
  };
}
