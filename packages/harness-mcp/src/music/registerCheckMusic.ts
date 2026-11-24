import { join } from "node:path";
import type { MusicCheck, StoryPlan } from "@yumekit/project";
import { measureMusicCurve } from "@yumekit/render";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { renderFailureOf } from "../output/renderFailures.js";
import { musicLengthOf } from "../replace/musicSwap.js";
import { failureResult } from "../results.js";
import { musicFitOf } from "./musicFit.js";
import { cueSheetOf, musicMapOf } from "./musicMap.js";
import { shotPlacementsOf } from "./shotPlacements.js";

function withCheck(options: { plan: StoryPlan; check: MusicCheck }): StoryPlan {
  const others = (options.plan.musicChecks ?? []).filter(
    (check) => check.assetId !== options.check.assetId,
  );
  return {
    ...options.plan,
    musicChecks: [...others, options.check].sort(
      (...[first, second]) => second.fit - first.fit,
    ),
  };
}

export function registerCheckMusic(context: HarnessContext): void {
  context.tools.add({
    name: "check_music",
    description:
      "Measure a music track against the music map of the story plan, at the times where the clips of the shots are placed: its loudness and its brightness (energy over 2 kHz) each half second. It finds the start in the track that fits the map best, and warns when the music starts at full level, does not rise where the map rises, peaks away from the planned peak, or is loudest under the end card. It stores the check, so the person can compare the candidates in the Music view. Place the best one with replace_music, asset_id, and start_seconds. It judges where the music is loud and bright, not whether it is good: the person judges that by ear.",
    inputSchema: { asset_id: idInput("The music track to check.") },
    annotations: { readOnlyHint: false },
    run: async ({ input }) => {
      const snapshot = context.store.read();
      const plan = snapshot.bible.storyPlan;
      if (plan === undefined) {
        return failureResult({
          kind: "story-plan-missing",
          message: "This project has no story plan, so it has no music map.",
          hint: "Write the plan with set_story_plan, with music_intensity for each shot.",
        });
      }
      const asset = snapshot.assets.find(
        (candidate) =>
          candidate.id === input.asset_id && candidate.kind === "audio",
      );
      if (asset === undefined) {
        return failureResult({
          kind: "asset-not-found",
          message: `The project has no music track "${input.asset_id}".`,
          hint: `Use one of: ${
            snapshot.assets
              .filter((candidate) => candidate.kind === "audio")
              .map((candidate) => candidate.id)
              .join(", ") || "none"
          }.`,
        });
      }
      const curve = await measureMusicCurve(
        join(context.store.folder, asset.file),
      );
      if (!curve.ok) return failureResult(renderFailureOf(curve.failure));
      const videoFrames = Math.max(
        0,
        ...snapshot.timelines.map((timeline) =>
          musicLengthOf({ timeline, assets: snapshot.assets }),
        ),
      );
      const parts = musicMapOf({
        plan,
        filmSeconds: videoFrames / snapshot.project.framesPerSecond,
        placements: shotPlacementsOf(snapshot),
      });
      const fit = musicFitOf({ curve: curve.value, parts });
      const check: MusicCheck = {
        assetId: asset.id,
        startSeconds: fit.startSeconds,
        fit: fit.fit,
        warnings: fit.warnings,
      };
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: { ...snapshot.bible, storyPlan: withCheck({ plan, check }) },
          },
        ],
        line: `"${asset.id}" fits the music map ${String(fit.fit)} of 1 from ${String(fit.startSeconds)}s of the track, and peaks at ${String(fit.peakSeconds)}s of the film. ${fit.warnings.length === 0 ? "No warnings." : fit.warnings.join(" ")}\nThe map:\n${cueSheetOf(parts)}`,
        data: {
          asset_id: asset.id,
          start_seconds: fit.startSeconds,
          fit: fit.fit,
          peak_seconds: fit.peakSeconds,
          warnings: fit.warnings,
        },
      });
    },
  });
}
