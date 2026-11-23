import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { frameInput, idInput } from "../inputs.js";
import { findAsset, findOutput } from "../lookups.js";
import { failureResult } from "../results.js";
import { planSound, scenesEndFrameOf } from "./soundPlan.js";

const defaultGainDecibels = -6;

export function registerPlaceSound(context: HarnessContext): void {
  context.tools.add({
    name: "place_sound",
    description:
      'Put a sound effect on the sound track of an output, at start_frame, for the length of the sound. The clip goes on the audio track "sounds", or on "sounds-2" and so on when a sound already plays there at the same time. The sound stops at the end of the last scene, so it never makes the video longer. The result gives track_id, clip_id, and the frames. One undo removes it. Make the sound first with generate_asset and the capability sound-effect.',
    inputSchema: {
      output_id: idInput("The id of the output."),
      asset_id: idInput(
        "The id of an audio asset, for example a sound effect.",
      ),
      start_frame: frameInput(
        "The frame of the output where the sound starts.",
      ),
      gain_decibels: z
        .number()
        .min(-60)
        .max(12)
        .optional()
        .describe(
          "The volume change in decibels. Default -6, a little below the voice.",
        ),
    },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const output = findOutput({ snapshot, outputId: input.output_id });
      if (!output.ok) return failureResult(output.failure);
      const asset = findAsset({ snapshot, assetId: input.asset_id });
      if (!asset.ok) return failureResult(asset.failure);
      const { durationFrames } = asset.value;
      if (asset.value.kind !== "audio" || durationFrames === undefined) {
        return failureResult({
          kind: "asset-not-audio",
          message: `The asset "${input.asset_id}" is of kind ${asset.value.kind}. A sound needs an audio asset.`,
          hint: 'Make a sound with generate_asset and the capability "sound-effect", then call place_sound with that asset_id.',
        });
      }
      const endFrame = scenesEndFrameOf(output.value.timeline);
      if (endFrame > 0 && input.start_frame >= endFrame) {
        return failureResult({
          kind: "start-after-the-end",
          message: `Frame ${String(input.start_frame)} is after the last scene of "${input.output_id}", which ends at frame ${String(endFrame)}.`,
          hint: `Choose a start_frame below ${String(endFrame)}.`,
        });
      }
      const length =
        endFrame === 0
          ? durationFrames
          : Math.min(durationFrames, endFrame - input.start_frame);
      const plan = planSound({
        timeline: output.value.timeline,
        assetId: input.asset_id,
        startFrame: input.start_frame,
        durationFrames: length,
        gainDecibels: input.gain_decibels ?? defaultGainDecibels,
      });
      return applyEditsResult({
        store: context.store,
        edits: plan.edits,
        line: `Sound "${input.asset_id}" placed on "${input.output_id}" track "${plan.trackId}" from frame ${String(input.start_frame)} to ${String(input.start_frame + length)}.`,
        data: {
          track_id: plan.trackId,
          clip_id: plan.clipId,
          start_frame: input.start_frame,
          duration_frames: length,
          end_frame: input.start_frame + length,
        },
      });
    },
  });
}
