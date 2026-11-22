import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { durationInput, frameInput, idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { registerUpdateClip } from "./registerUpdateClip.js";
import { wireTransition } from "../transitions/wireTransition.js";
import { audioClipOf, sceneClipOf } from "./wireTimeline.js";

const addClipInput = {
  output_id: idInput("The id of the output."),
  track_id: idInput("The id of a track from get_timeline."),
  clip_id: idInput(
    "The id of the new clip. Optional: a random id is made when it is missing.",
  ).optional(),
  scene_id: idInput("The scene to show, on a scene track.").optional(),
  asset_id: idInput("The audio asset to play, on an audio track.").optional(),
  start_frame: frameInput("The frame of the output where the clip starts."),
  duration_frames: durationInput("The length of the clip."),
  scene_start_frame: frameInput(
    "Scene clip only: the first frame of the scene to show. Default 0.",
  ).optional(),
  asset_start_frame: frameInput(
    "Audio clip only: the first frame of the asset to play. Default 0.",
  ).optional(),
  gain_decibels: z
    .number()
    .optional()
    .describe("Audio clip only: volume change in decibels. Default 0."),
  transition: wireTransition.optional(),
};

type AddClipInput = z.infer<z.ZodObject<typeof addClipInput>>;

function registerAddClip(context: HarnessContext): void {
  context.tools.add({
    name: "add_clip",
    description:
      "Add one clip to an existing track. Give scene_id for a scene track or asset_id for an audio track. To add a track, use set_timeline.",
    inputSchema: addClipInput,
    run: ({ input }) => addClip({ context, input }),
  });
}

function addClip(options: {
  context: HarnessContext;
  input: AddClipInput;
}): Promise<CallToolResult> | CallToolResult {
  const { context, input } = options;
  const timing = {
    id: input.clip_id,
    start_frame: input.start_frame,
    duration_frames: input.duration_frames,
  };
  const { scene_id: sceneId, asset_id: assetId } = input;
  const clip =
    sceneId !== undefined && assetId === undefined
      ? sceneClipOf({
          clip: {
            ...timing,
            scene_id: sceneId,
            scene_start_frame: input.scene_start_frame,
            transition: input.transition,
          },
          framesPerSecond: context.store.read().project.framesPerSecond,
        })
      : assetId !== undefined && sceneId === undefined
        ? audioClipOf({
            ...timing,
            asset_id: assetId,
            asset_start_frame: input.asset_start_frame,
            gain_decibels: input.gain_decibels,
          })
        : undefined;
  if (clip === undefined) {
    return failureResult({
      kind: "clip-target-missing",
      message: "add_clip needs exactly one of scene_id and asset_id.",
      hint: "Give scene_id for a clip on a scene track, or asset_id for a clip on an audio track. Call get_timeline to see the kind of each track.",
    });
  }
  return applyEditsResult({
    store: context.store,
    edits: [
      {
        kind: "addClip",
        outputId: input.output_id,
        trackId: input.track_id,
        clip,
      },
    ],
    line: `Clip "${clip.id}" added to track "${input.track_id}".`,
    data: { clip_id: clip.id },
    hints: {
      "invalid-value":
        "A scene clip goes on a scene track and an audio clip on an audio track. Call get_timeline to see the kind of each track, and correct the value that the message names.",
    },
  });
}

export function registerClipTools(context: HarnessContext): void {
  registerAddClip(context);
  registerUpdateClip(context);
}
