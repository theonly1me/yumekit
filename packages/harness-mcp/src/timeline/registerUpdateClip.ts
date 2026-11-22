import type { Edit } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { durationInput, frameInput, idInput } from "../inputs.js";
import { transitionOf, wireTransition } from "../transitions/wireTransition.js";

type ClipChanges = Extract<Edit, { kind: "updateClip" }>["changes"];

const updateClipInput = {
  output_id: idInput("The id of the output."),
  clip_id: idInput("The id of the clip from get_timeline."),
  start_frame: frameInput("The new start frame.").optional(),
  duration_frames: durationInput("The new length.").optional(),
  scene_id: idInput(
    "Scene clip only: the id of another scene to show in the same place.",
  ).optional(),
  scene_start_frame: frameInput(
    "Scene clip only: the new first frame of the scene.",
  ).optional(),
  asset_id: idInput(
    "Audio clip only: the id of another audio asset to play. The clip must not read past its end.",
  ).optional(),
  asset_start_frame: frameInput(
    "Audio clip only: the new first frame of the asset.",
  ).optional(),
  gain_decibels: z
    .number()
    .optional()
    .describe("Audio clip only: the new volume change in decibels."),
  transition: wireTransition.optional(),
};

type UpdateClipInput = z.infer<z.ZodObject<typeof updateClipInput>>;

function changesOf(options: {
  input: UpdateClipInput;
  framesPerSecond: number;
}): ClipChanges {
  const { input, framesPerSecond } = options;
  return {
    ...(input.start_frame === undefined
      ? {}
      : { startFrame: input.start_frame }),
    ...(input.duration_frames === undefined
      ? {}
      : { durationFrames: input.duration_frames }),
    ...(input.scene_id === undefined ? {} : { sceneId: input.scene_id }),
    ...(input.scene_start_frame === undefined
      ? {}
      : { sceneStartFrame: input.scene_start_frame }),
    ...(input.asset_id === undefined ? {} : { assetId: input.asset_id }),
    ...(input.asset_start_frame === undefined
      ? {}
      : { assetStartFrame: input.asset_start_frame }),
    ...(input.gain_decibels === undefined
      ? {}
      : { gainDecibels: input.gain_decibels }),
    ...(input.transition === undefined
      ? {}
      : {
          transition: transitionOf({
            wire: input.transition,
            framesPerSecond,
          }),
        }),
  };
}

export function registerUpdateClip(context: HarnessContext): void {
  context.tools.add({
    name: "update_clip",
    description:
      "Change the timing, the gain, or the target of one clip. Give only the fields to change. scene_id shows another scene in the same place, for example a tall version of a scene in the tall output. asset_id plays another audio asset. transition with kind cut removes the transition of a scene clip.",
    inputSchema: updateClipInput,
    run: ({ input }) =>
      applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "updateClip",
            outputId: input.output_id,
            clipId: input.clip_id,
            changes: changesOf({
              input,
              framesPerSecond: context.store.read().project.framesPerSecond,
            }),
          },
        ],
        line: `Clip "${input.clip_id}" changed.`,
      }),
  });
}
