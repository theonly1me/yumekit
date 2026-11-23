import { z } from "zod";
import type { Edit } from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { tooShortFailureOf } from "../timeline/narrationChecks.js";
import { assetOf, makeAsset, type MadeAsset } from "./makeAsset.js";
import { captionSceneOf } from "./captionScene.js";
import { narrationSwapOf } from "./narrationSwap.js";
import { notInScriptFailureOf, spokenTextOf } from "./scriptText.js";
import { lengthWithout, outputIdsOf } from "./soundRoles.js";
import { voiceRequestOf } from "./voiceRequest.js";

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
      'Record the voice again and put it, with its captions, in the place of the old voice in each output. Use it for "Record the voice again" and for another voice. By default it says the whole script of now with the voice of the old narration. It changes no other clip, no scene, and no transition, so the music, the video clips, the sounds, and the transitions stay. One undo brings the old voice back.',
    inputSchema: replaceNarrationInput,
    run: async ({ input, onProgress }) => {
      const snapshot = context.store.read();
      const text = input.text ?? snapshot.script.trim();
      if (input.asset_id === undefined && text === "") {
        return failureResult({
          kind: "no-script",
          message:
            "The project has no script, so the voice has nothing to say.",
          hint: "Write the script with set_script, then call replace_narration again.",
        });
      }
      const made: MadeAsset =
        input.asset_id === undefined
          ? await madeVoice({ context, input, text, onProgress })
          : assetOf({ context, assetId: input.asset_id });
      if (!made.ok) return made.result;
      const { asset } = made;
      const notInScript = notInScriptFailureOf({
        script: snapshot.script,
        text: spokenTextOf(asset),
      });
      if (notInScript !== undefined) return failureResult(notInScript);
      const latest = context.store.read();
      const caption = captionSceneOf({ snapshot: latest, asset });
      const edits: Edit[] = [...caption.edits];
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
          asset,
          captionSceneId: caption.sceneId,
          withCaptions: input.with_captions,
        });
        const tooShort = tooShortFailureOf({
          assetFrames: asset.durationFrames,
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
      return applyEditsResult({
        store: context.store,
        edits,
        line: `The voice "${asset.id}" replaced the old voice. Nothing else changed.`,
        data: { asset_id: asset.id, duration_frames: asset.durationFrames },
      });
    },
  });
}

function madeVoice(options: {
  context: HarnessContext;
  input: z.infer<z.ZodObject<typeof replaceNarrationInput>>;
  text: string;
  onProgress: Parameters<typeof makeAsset>[0]["onProgress"];
}): Promise<MadeAsset> {
  const { context, input, text } = options;
  const notInScript = notInScriptFailureOf({
    script: context.store.read().script,
    text,
  });
  if (notInScript !== undefined) {
    return Promise.resolve({ ok: false, result: failureResult(notInScript) });
  }
  return makeAsset({
    context,
    request: voiceRequestOf({
      snapshot: context.store.read(),
      choice: {
        text,
        voice: input.voice,
        server: input.server,
        model: input.model,
        pronunciations: input.pronunciations,
      },
    }),
    onProgress: options.onProgress,
  });
}
