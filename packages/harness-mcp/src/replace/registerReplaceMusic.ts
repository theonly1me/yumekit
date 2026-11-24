import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { uniqueId } from "../timeline/narrationPlan.js";
import { assetOf, makeAsset, type MadeAsset } from "./makeAsset.js";
import { musicLengthOf, musicSwapOf } from "./musicSwap.js";
import { outputIdsOf } from "./soundRoles.js";

const replaceMusicInput = {
  prompt: z
    .string()
    .min(1)
    .optional()
    .describe("What the new music sounds like. Give prompt or asset_id."),
  asset_id: idInput(
    "An audio asset that is already made, for example a file of the person.",
  ).optional(),
  server: z
    .string()
    .optional()
    .describe(
      "Only when the person names a service. Default: the picks of the person.",
    ),
  model: z.string().min(1).optional().describe("Only with server."),
  gain_decibels: z
    .number()
    .min(-60)
    .max(12)
    .optional()
    .describe("The volume. Default: the volume of the old music, or -12."),
  start_seconds: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Where in the track the music starts, for example the best start of check_music. Default 0.",
    ),
  output_ids: z
    .array(idInput("The id of an output."))
    .min(1)
    .optional()
    .describe("The outputs to change. Default: each output."),
};

export function registerReplaceMusic(context: HarnessContext): void {
  context.tools.add({
    name: "replace_music",
    description:
      "Put new music in the place of the old music in each output, from a prompt or from an audio asset, from start_seconds of the track. The music repeats to the end of the video. It changes no other clip, no scene, and no transition. One undo brings the old music back.",
    inputSchema: replaceMusicInput,
    run: async ({ input, onProgress }) => {
      const snapshot = context.store.read();
      const outputIds = outputIdsOf({ snapshot, outputIds: input.output_ids });
      const timelines = snapshot.timelines.filter((timeline) =>
        outputIds.includes(timeline.outputId),
      );
      const longest = Math.max(
        0,
        ...timelines.map((timeline) =>
          musicLengthOf({ timeline, assets: snapshot.assets }),
        ),
      );
      if (longest === 0) {
        return failureResult({
          kind: "no-video-yet",
          message: "The video has no scenes yet, so the music has no length.",
          hint: "Build the timeline first, then call replace_music.",
        });
      }
      if (input.asset_id === undefined && input.prompt === undefined) {
        return failureResult({
          kind: "invalid-input",
          message: "replace_music needs prompt or asset_id.",
          hint: "Give a prompt for new music, or the asset_id of an audio file.",
        });
      }
      const made: MadeAsset =
        input.asset_id === undefined
          ? await makeAsset({
              context,
              request: {
                asset_id: uniqueId({
                  base: "music",
                  taken: snapshot.assets.map((asset) => asset.id),
                }),
                capability: "music",
                ...(input.server === undefined ? {} : { server: input.server }),
                ...(input.model === undefined ? {} : { model: input.model }),
                input: {
                  prompt: input.prompt ?? "",
                  duration_seconds: Math.ceil(
                    longest / snapshot.project.framesPerSecond,
                  ),
                },
              },
              onProgress,
            })
          : assetOf({ context, assetId: input.asset_id });
      if (!made.ok) return made.result;
      const latest = context.store.read();
      return applyEditsResult({
        store: context.store,
        edits: latest.timelines
          .filter((timeline) => outputIds.includes(timeline.outputId))
          .map((timeline) => ({
            kind: "setTimeline" as const,
            timeline: musicSwapOf({
              timeline,
              assets: latest.assets,
              asset: made.asset,
              gainDecibels: input.gain_decibels,
              assetStartFrame: Math.round(
                (input.start_seconds ?? 0) * latest.project.framesPerSecond,
              ),
            }),
          })),
        line: `The music "${made.asset.id}" replaced the old music. Nothing else changed.`,
        data: { asset_id: made.asset.id },
      });
    },
  });
}
