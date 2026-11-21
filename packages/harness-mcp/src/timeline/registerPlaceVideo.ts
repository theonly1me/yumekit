import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { durationInput, frameInput, idInput } from "../inputs.js";
import { findAsset, findOutput } from "../lookups.js";
import { failureResult } from "../results.js";
import { placementFramesOf } from "./videoPlacementFrames.js";
import { planVideo } from "./videoPlan.js";

const defaultSoundGainDecibels = -12;

const share = z.number().min(0).max(1);

const placeVideoInput = {
  output_id: idInput("The id of the output."),
  asset_id: idInput("The id of a video asset from generate_asset."),
  start_frame: frameInput(
    "The frame of the output where the video starts. The default is the start of the clip of replace_clip_id.",
  ).optional(),
  duration_frames: durationInput(
    "The length of the clip. The default is the length of the clip of replace_clip_id, or else the length of the video. A longer clip holds the last picture.",
  ).optional(),
  replace_clip_id: idInput(
    "A scene clip to replace. The tool removes it, and the sound clip of its video when it shows a video-clip scene, in the same batch.",
  ).optional(),
  focus: z
    .strictObject({
      x: share.describe("From 0 (left edge) to 1 (right edge)."),
      y: share.describe("From 0 (top edge) to 1 (bottom edge)."),
    })
    .optional()
    .describe(
      "The point of the video that stays visible when the output cuts it, for example the face of the subject in a wide video in a tall output. The default is the center. It applies only when place_video makes the scene.",
    ),
  sound_gain_decibels: z
    .union([z.number().max(0), z.literal("off")])
    .optional()
    .describe(
      'The level of the sound of the video, in decibels, 0 or less. The default is -12, so narration stays in front. "off" adds no sound clip.',
    ),
};

export function registerPlaceVideo(context: HarnessContext): void {
  context.tools.add({
    name: "place_video",
    description:
      'Show a video asset in an output, with its sound. Makes a video-clip scene "video-<asset_id>" (or uses that scene when it exists, with no change to its props), adds a clip of it on the first scene track that is not a caption track (or on a new scene track "scenes" below the others), and adds the sound of the video on the audio track "video-sound". Each video asset gets its own scene, so to show several clips, call place_video once for each asset. A video without sound gets no sound clip, and the "video-sound" track appears only when a sound clip is added. The clip ids are "video-<asset_id>" and "video-sound-<asset_id>", and a suffix such as "-2" keeps each id unique. With replace_clip_id, the video takes the place of that scene clip: the tool removes the clip, and the sound clip of its video when it shows a video-clip scene, and places the video at its start frame with its length, unless start_frame or duration_frames are given. The result gives scene_id, scene_clip_id, and sound_clip_id. One undo removes all of it and brings back a replaced clip.',
    inputSchema: placeVideoInput,
    run: ({ input: request }) => {
      const snapshot = context.store.read();
      const output = findOutput({ snapshot, outputId: request.output_id });
      if (!output.ok) return failureResult(output.failure);
      const asset = findAsset({ snapshot, assetId: request.asset_id });
      if (!asset.ok) return failureResult(asset.failure);
      const assetLength = asset.value.durationFrames;
      if (asset.value.kind !== "video" || assetLength === undefined) {
        return failureResult({
          kind: "asset-not-video",
          message: `The asset "${request.asset_id}" is of kind ${asset.value.kind} with no video length. place_video needs a video asset.`,
          hint: 'Make a video with generate_asset and capability "video", or import one with import_asset and kind "video". Then call place_video with that asset_id.',
        });
      }
      const frames = placementFramesOf({
        snapshot,
        timeline: output.value.timeline,
        assetLength,
        startFrame: request.start_frame,
        durationFrames: request.duration_frames,
        replaceClipId: request.replace_clip_id,
      });
      if (!frames.ok) return failureResult(frames.failure);
      const { startFrame, durationFrames } = frames.value;
      const plan = planVideo({
        snapshot,
        timeline: frames.value.remainingTimeline,
        placement: {
          asset: { ...asset.value, durationFrames: assetLength },
          startFrame,
          durationFrames,
          focus: request.focus,
          soundGainDecibels:
            request.sound_gain_decibels ?? defaultSoundGainDecibels,
        },
      });
      const endFrame = startFrame + durationFrames;
      return applyEditsResult({
        store: context.store,
        edits: [...frames.value.removeEdits, ...plan.edits],
        line: `Video "${request.asset_id}" placed on "${request.output_id}" from frame ${String(startFrame)} to ${String(endFrame)}${plan.soundClipId === undefined ? " with no sound clip" : " with its sound"}.`,
        data: {
          scene_id: plan.sceneId,
          scene_clip_id: plan.sceneClipId,
          scene_track_id: plan.sceneTrackId,
          ...(plan.soundClipId === undefined
            ? {}
            : {
                sound_clip_id: plan.soundClipId,
                sound_track_id: "video-sound",
              }),
          start_frame: startFrame,
          duration_frames: durationFrames,
          end_frame: endFrame,
        },
        hints: {
          "clips-overlap": `Another clip already uses frames ${String(startFrame)} to ${String(endFrame - 1)} on the scene track "${plan.sceneTrackId}" or the audio track "video-sound". Call get_timeline, then choose another start_frame, or shorten or remove the old clip.`,
        },
      });
    },
  });
}
