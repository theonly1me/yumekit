import { z } from "zod";
import type { Edit } from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { tooShortFailureOf } from "../timeline/narrationChecks.js";
import { recordVoices } from "./recordVoice.js";
import { captionSceneOf } from "./captionScene.js";
import { narrationSwapOf } from "./narrationSwap.js";
import { notInScriptFailureOf, spokenTextOf } from "./scriptText.js";
import { lengthWithout, outputIdsOf } from "./soundRoles.js";

const replaceNarrationInput = {
  text: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The words to say. Default: the whole script of now. It must be lines of the script, word for word.",
    ),
  voice: z
    .string()
    .optional()
    .describe(
      "Another voice, when the person asks for one. Default: the voice of the old narration.",
    ),
  server: z
    .string()
    .optional()
    .describe(
      "Only when the person names a service. Default: the picks of the person.",
    ),
  model: z.string().min(1).optional().describe("Only with server."),
  pronunciations: z
    .record(z.string(), z.string())
    .optional()
    .describe('How a name sounds, for example {"Hoshi": "hoe she"}.'),
  asset_id: idInput(
    "A speech asset that is already made. With it, the tool records nothing and uses this voice.",
  ).optional(),
  output_ids: z
    .array(idInput("The id of an output."))
    .min(1)
    .optional()
    .describe("The outputs to change. Default: each output."),
  with_captions: z
    .boolean()
    .optional()
    .describe(
      "Default: captions where the output has captions now, and captions for a first voice.",
    ),
};

export function registerReplaceNarration(context: HarnessContext): void {
  context.tools.add({
    name: "replace_narration",
    description:
      'Record the voice again and put it, with its captions, in the place of the old voice in each output. Use it for "Record the voice again" and for another voice. By default it says the script of now with the voice of the old narration. When the old voice has one clip for each line of the script, it records each line and puts it where the old line started, and a line that did not change keeps its recording. It changes no other clip, no scene, and no transition, so the music, the video clips, the sounds, and the transitions stay. One undo brings the old voice back.',
    inputSchema: replaceNarrationInput,
    run: async ({ input, onProgress }) => {
      const snapshot = context.store.read();
      if (input.asset_id === undefined && snapshot.script.trim() === "") {
        return failureResult({
          kind: "no-script",
          message:
            "The project has no script, so the voice has nothing to say.",
          hint: "Write the script with set_script, then call replace_narration again.",
        });
      }
      const made = await recordVoices({
        context,
        wish: {
          text: input.text,
          assetId: input.asset_id,
          choice: {
            voice: input.voice,
            server: input.server,
            model: input.model,
            pronunciations: input.pronunciations,
          },
        },
        onProgress,
      });
      if (!made.ok) return made.result;
      for (const asset of made.assets) {
        const notInScript = notInScriptFailureOf({
          script: snapshot.script,
          text: spokenTextOf(asset),
        });
        if (notInScript !== undefined) return failureResult(notInScript);
      }
      const latest = context.store.read();
      const edits: Edit[] = [];
      const pieces = made.assets.map((asset) => {
        const caption = captionSceneOf({ snapshot: latest, asset });
        edits.push(...caption.edits);
        return { asset, captionSceneId: caption.sceneId };
      });
      let voiceFrames = 0;
      for (const piece of pieces) voiceFrames += piece.asset.durationFrames;
      for (const outputId of outputIdsOf({
        snapshot: latest,
        outputIds: input.output_ids,
      })) {
        const timeline = latest.timelines.find(
          (candidate) => candidate.outputId === outputId,
        );
        if (timeline === undefined) continue;
        const swap = narrationSwapOf({
          snapshot: latest,
          timeline,
          pieces,
          withCaptions: input.with_captions,
        });
        const tooShort = tooShortFailureOf({
          assetFrames: voiceFrames,
          videoFrames: lengthWithout({
            timeline,
            trackIds: timeline.tracks
              .map((track) => track.id)
              .filter((id) => !swap.videoTrackIds.includes(id)),
          }),
          framesPerSecond: latest.project.framesPerSecond,
          isPartial: false,
        });
        if (tooShort !== undefined) return failureResult(tooShort);
        edits.push({ kind: "setTimeline", timeline: swap.timeline });
      }
      const assetIds = made.assets.map((asset) => asset.id);
      return applyEditsResult({
        store: context.store,
        edits,
        line: `The new voice (${assetIds.join(", ")}) replaced the old voice. Nothing else changed.`,
        data: { asset_ids: assetIds, duration_frames: voiceFrames },
      });
    },
  });
}
