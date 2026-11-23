import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { frameInput, idInput } from "../inputs.js";
import { findAsset, findOutput } from "../lookups.js";
import { failureResult, successResult } from "../results.js";
import { notInScriptFailureOf, spokenTextOf } from "../replace/scriptText.js";
import { isTestServerAsset, tooShortFailureOf } from "./narrationChecks.js";
import { planNarration } from "./narrationPlan.js";
import { lengthFramesOf } from "./wireTimeline.js";

function registerPlaceNarration(context: HarnessContext): void {
  context.tools.add({
    name: "place_narration",
    description:
      'Put a speech asset on the audio track of an output for its full length. With with_captions, also add a caption-words scene on a caption track above the other scenes, timed to the same frames. The audio clip goes on the first audio track other than "video-sound", or on a new audio track "narration". The caption clip goes on the top scene track when it holds only captions, or on a new scene track "captions" above the others. The audio clip id is "narration-<asset_id>", the caption clip id and the caption scene id are "captions-<asset_id>", and a suffix such as "-2" keeps each id unique. The result gives audio_clip_id, caption_clip_id, and caption_scene_id. The words of the voice must be lines of the script, or it fails with text-not-in-the-script. To record the voice again or to change it, call replace_narration. One undo removes all of it.',
    inputSchema: {
      output_id: idInput("The id of the output."),
      asset_id: idInput("The id of a speech asset from generate_asset."),
      start_frame: frameInput(
        "The frame of the output where the narration starts.",
      ),
      with_captions: z
        .boolean()
        .optional()
        .describe(
          "Also show the words as captions. Needs word timings. Default true for a voice with word timings, so a new video has captions; the person switches them off in the editor. A voice of the free test service gets no captions.",
        ),
      partial: z
        .boolean()
        .optional()
        .describe(
          "True when this voice covers only a part of the video on purpose. Without it, a voice shorter than two thirds of the video fails with narration-too-short.",
        ),
    },
    run: ({
      input: { output_id, asset_id, start_frame, with_captions, partial },
    }) => {
      const snapshot = context.store.read();
      const output = findOutput({ snapshot, outputId: output_id });
      if (!output.ok) return failureResult(output.failure);
      const asset = findAsset({ snapshot, assetId: asset_id });
      if (!asset.ok) return failureResult(asset.failure);
      const { durationFrames } = asset.value;
      if (asset.value.kind !== "audio" || durationFrames === undefined) {
        return failureResult({
          kind: "asset-not-audio",
          message: `The asset "${asset_id}" is of kind ${asset.value.kind}. Narration needs an audio asset.`,
          hint: 'Make speech with generate_asset and capability "speech", then call place_narration with that asset_id.',
        });
      }
      const notInScript = notInScriptFailureOf({
        script: snapshot.script,
        text: spokenTextOf(asset.value),
      });
      if (notInScript !== undefined) return failureResult(notInScript);
      const tooShort = tooShortFailureOf({
        assetFrames: durationFrames,
        videoFrames: lengthFramesOf(output.value.timeline),
        framesPerSecond: snapshot.project.framesPerSecond,
        isPartial: partial ?? false,
      });
      if (tooShort !== undefined) return failureResult(tooShort);
      const isTestVoice = isTestServerAsset(asset.value);
      const withCaptions =
        (with_captions ?? asset.value.hasWords) && !isTestVoice;
      if (withCaptions && !asset.value.hasWords) {
        return failureResult({
          kind: "asset-has-no-words",
          message: `The asset "${asset_id}" has no word timings, so captions cannot follow it.`,
          hint: `Call align_words with asset_id "${asset_id}" and the spoken text, then call place_narration again. Or set with_captions to false.`,
        });
      }
      const plan = planNarration({
        snapshot,
        timeline: output.value.timeline,
        asset: { ...asset.value, durationFrames },
        startFrame: start_frame,
        withCaptions,
      });
      return applyEditsResult({
        store: context.store,
        edits: plan.edits,
        line: `Narration "${asset_id}" placed on "${output_id}" from frame ${String(start_frame)} to ${String(start_frame + durationFrames)}${withCaptions ? " with captions" : ""}.${with_captions === true && isTestVoice ? " It has no captions, because the voice is a test tone of the free test service." : ""}`,
        data: {
          audio_clip_id: plan.audioClipId,
          ...(plan.captionClipId === undefined
            ? {}
            : { caption_clip_id: plan.captionClipId }),
          ...(plan.captionSceneId === undefined
            ? {}
            : { caption_scene_id: plan.captionSceneId }),
          start_frame,
          duration_frames: durationFrames,
          end_frame: start_frame + durationFrames,
        },
        hints: {
          "clips-overlap": `Another clip already uses frames ${String(start_frame)} to ${String(start_frame + durationFrames - 1)} on the audio or caption track. Call get_timeline, then choose a start_frame after the last narration, or remove the old clip with remove_clip.`,
        },
      });
    },
  });
}

function registerHistoryTools(context: HarnessContext): void {
  context.tools.add({
    name: "undo",
    description:
      "Undo the last change to the project. Each tool call that changed the project is one step.",
    inputSchema: {},
    run: async () => {
      const undone = await context.store.undo();
      return undone.ok
        ? successResult({
            line: "Undone.",
            data: { revision: undone.value.revision },
          })
        : failureResult({
            kind: "nothing-to-undo",
            message: "There is no change to undo.",
            hint: "Call get_project to see the current state.",
          });
    },
  });
  context.tools.add({
    name: "redo",
    description: "Redo the last change that undo reverted.",
    inputSchema: {},
    run: async () => {
      const redone = await context.store.redo();
      return redone.ok
        ? successResult({
            line: "Redone.",
            data: { revision: redone.value.revision },
          })
        : failureResult({
            kind: "nothing-to-redo",
            message:
              "There is no undone change to redo. A new change clears the redo steps.",
            hint: "Call get_project to see the current state.",
          });
    },
  });
}

export function registerNarrationAndHistoryTools(
  context: HarnessContext,
): void {
  registerPlaceNarration(context);
  registerHistoryTools(context);
}
