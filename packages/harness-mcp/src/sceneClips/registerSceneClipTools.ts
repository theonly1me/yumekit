import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { registerDuplicateSceneClip } from "./registerDuplicateSceneClip.js";
import { registerSetTrackOff } from "./registerSetTrackOff.js";
import { movedRow, resizedRow, rowWithout } from "./rowArrangements.js";
import { rowChangeResult } from "./rowChangeResult.js";
import { rowTargetsOf } from "./rowTargets.js";
import {
  outputIdsInput,
  sceneClipIdInput,
  sceneClipToolNote,
} from "./sceneClipInputs.js";

function registerResizeSceneClip(context: HarnessContext): void {
  context.tools.add({
    name: "resize_scene_clip",
    description: `Set the length of one scene clip, and move each later clip of the scenes row by the difference, so the row keeps its order and its gaps. The sound of each later video moves with its clip. The sound of the clip itself ends with the clip, and grows at most to the end of its file. Use it in place of update_clip when a scene gets longer or shorter. ${sceneClipToolNote}`,
    inputSchema: {
      output_ids: outputIdsInput,
      clip_id: sceneClipIdInput,
      duration_frames: z
        .int()
        .describe("The new length of the clip. In whole frames, 1 or more."),
    },
    run: ({ input }) => {
      if (input.duration_frames < 1) {
        return failureResult({
          kind: "invalid-duration",
          message: `A clip needs a length of 1 frame or more, not ${String(input.duration_frames)}.`,
          hint: "Give duration_frames of 1 or more. To take the scene out, call remove_scene_clip.",
        });
      }
      const targets = rowTargetsOf({
        snapshot: context.store.read(),
        clipId: input.clip_id,
        outputIds: input.output_ids,
      });
      if (!targets.ok) return failureResult(targets.failure);
      return rowChangeResult({
        context,
        changes: targets.value.map((target) => ({
          target,
          clips: resizedRow({
            ...target,
            durationFrames: input.duration_frames,
          }),
        })),
        line: `Clip "${input.clip_id}" is now ${String(input.duration_frames)} frames long.`,
      });
    },
  });
}

function registerMoveSceneClip(context: HarnessContext): void {
  context.tools.add({
    name: "move_scene_clip",
    description: `Put one scene clip at another place in the scenes row. The tool then places the clips of the row end to end from the start frame of the first clip, so each clip keeps its length and a gap between clips closes. The sound of each video moves with its clip. An index equal to the current index changes nothing. Use it in place of update_clip to change the order of the scenes. ${sceneClipToolNote}`,
    inputSchema: {
      output_ids: outputIdsInput,
      clip_id: sceneClipIdInput,
      to_index: z
        .int()
        .describe(
          "The new place of the clip in the row, in start order. 0 is the first clip. The last index is the clip count minus 1.",
        ),
    },
    run: ({ input }) => {
      const targets = rowTargetsOf({
        snapshot: context.store.read(),
        clipId: input.clip_id,
        outputIds: input.output_ids,
      });
      if (!targets.ok) return failureResult(targets.failure);
      const outside = targets.value.find(
        (target) => input.to_index < 0 || input.to_index >= target.clips.length,
      );
      if (outside !== undefined) {
        return failureResult({
          kind: "index-out-of-range",
          message: `The scenes row of the output "${outside.timeline.outputId}" has ${String(outside.clips.length)} clips, so to_index ${String(input.to_index)} is outside the row.`,
          hint: `Give to_index from 0 to ${String(outside.clips.length - 1)}. Call get_timeline to see the clips of the row.`,
        });
      }
      return rowChangeResult({
        context,
        changes: targets.value.map((target) => ({
          target,
          clips: movedRow({ ...target, toIndex: input.to_index }),
        })),
        line: `Clip "${input.clip_id}" moved to place ${String(input.to_index)} of the scenes row.`,
      });
    },
  });
}

function registerRemoveSceneClip(context: HarnessContext): void {
  context.tools.add({
    name: "remove_scene_clip",
    description: `Remove one scene clip from the scenes row, and move each later clip of the row earlier by its length. Other gaps stay. The sound of the removed video goes with it, and the sound of each later video moves with its clip. The scene stays in the project; remove it with remove_scene when no clip shows it. Use it in place of remove_clip to take a scene out of the video. ${sceneClipToolNote}`,
    inputSchema: { output_ids: outputIdsInput, clip_id: sceneClipIdInput },
    annotations: { destructiveHint: true },
    run: ({ input }) => {
      const targets = rowTargetsOf({
        snapshot: context.store.read(),
        clipId: input.clip_id,
        outputIds: input.output_ids,
      });
      if (!targets.ok) return failureResult(targets.failure);
      return rowChangeResult({
        context,
        changes: targets.value.map((target) => ({
          target,
          clips: rowWithout(target),
        })),
        line: `Clip "${input.clip_id}" removed from the scenes row.`,
      });
    },
  });
}

export function registerSceneClipTools(context: HarnessContext): void {
  registerResizeSceneClip(context);
  registerMoveSceneClip(context);
  registerRemoveSceneClip(context);
  registerDuplicateSceneClip(context);
  registerSetTrackOff(context);
}
