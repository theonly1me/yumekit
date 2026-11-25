import { join } from "node:path";
import { measureClipMotion } from "@yumekit/render";
import { z } from "zod";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { idInput } from "../../inputs.js";
import { regionInput } from "../../media/markInputs.js";
import { renderFailureOf } from "../../output/renderFailures.js";
import { failureResult } from "../../results.js";
import { joinedContent, pictureOf } from "../criticPictures.js";
import { designIssuesOf, designFrameInput } from "./designAnswer.js";
import { designBriefLinesOf } from "./designBrief.js";
import {
  designCheckOf,
  designChecksOf,
  designLineOf,
  withDesignChecks,
} from "./designRecord.js";
import type { DesignCropSeen } from "./designJob.js";
import { designTargetOf } from "./designTarget.js";
import { designViewOf } from "./designView.js";

const checkDesignInput = {
  asset_id: idInput("The picture or the clip of a shot to check."),
  shot_id: idInput("The shot of the story plan that it shows."),
  cast_id: idInput(
    "To look: the person to crop, with region and seconds (a clip).",
  ).optional(),
  region: regionInput
    .optional()
    .describe("The part of the frame with the person, as shares from 0 to 1."),
  seconds: z
    .number()
    .min(0)
    .optional()
    .describe("For a clip: the time of the frame to crop."),
  design: z
    .array(designFrameInput)
    .optional()
    .describe(
      "To store: your whole answer, one entry for each person and each frame of the list, as the critic gives it.",
    ),
};

export function registerCheckDesign(context: HarnessContext): void {
  const seenByAsset = new Map<string, DesignCropSeen[]>();
  context.tools.add({
    name: "check_design",
    description:
      "The design check, run by you when no critic looks at the work. Each person with a look must look exactly as the turnaround of the look of the shot: the same hair, each garment with its construction, each prop with its count and side. With asset_id and shot_id only: the list of questions, the frames to answer, and the pictures. With cast_id and region (and seconds for a clip): the enlarged crop next to the turnaround. With design: your answers, stored as the design check of the picture or the clip. A no marks a break: a picture with a break cannot start or end a clip, and only the clean part of a clip can be placed, unless the person chooses it. A check by the critic is never replaced.",
    inputSchema: checkDesignInput,
    run: async ({ input }) => {
      const snapshot = context.store.read();
      const target = designTargetOf({ snapshot, input });
      if (!target.ok) return failureResult(target.failure);
      const { shot, asset } = target.value;
      const isClip = asset.kind === "video";
      const motion = isClip
        ? await measureClipMotion({
            file: join(context.store.folder, asset.file),
          })
        : undefined;
      if (motion !== undefined && !motion.ok) {
        return failureResult(renderFailureOf(motion.failure));
      }
      const built = target.value.jobOf(motion?.value.warnings ?? []);
      if (built === undefined) {
        return failureResult({
          kind: "no-design",
          message: `No person of shot "${shot.id}" has a look with facts, so the design check has nothing to compare.`,
          hint: "Give each person base facts and looks with put_cast_member.",
        });
      }
      const seen = seenByAsset.get(asset.id) ?? [];
      seenByAsset.set(asset.id, seen);
      const job = { ...built, seen };
      if (input.design !== undefined) {
        const frames = input.design;
        const issues = designIssuesOf({ job, frames });
        if (issues.length > 0) {
          return failureResult({
            kind: "review-not-valid",
            message: `The answer is not whole: ${issues.join(" ")}`,
            hint: "Look again where you need to, and call again with the whole answer.",
          });
        }
        if (designCheckOf({ shot, assetId: asset.id })?.by === "critic") {
          return failureResult({
            kind: "critic-checked",
            message: `The critic already checked the design of "${asset.id}".`,
            hint: "The check of the critic stays. Make a new picture or clip to check again.",
          });
        }
        const checks = designChecksOf({ job, frames, by: "lead" });
        return context.writeLatest(async () => {
          const latest = context.store.read().bible;
          const plan = latest.storyPlan;
          if (plan === undefined) throw new Error("A shot needs a plan.");
          const [check] = checks;
          return applyEditsResult({
            store: context.store,
            edits: [
              {
                kind: "setBible",
                bible: {
                  ...latest,
                  storyPlan: {
                    ...plan,
                    shots: plan.shots.map((candidate) =>
                      candidate.id === shot.id
                        ? withDesignChecks({ shot: candidate, checks })
                        : candidate,
                    ),
                  },
                },
              },
            ],
            line: `Design check of "${asset.id}" stored.${designLineOf(checks)}`,
            data: {
              design_breaks: check?.breaks ?? [],
              ...(check?.cleanUntilSeconds === undefined
                ? {}
                : { clean_until_seconds: check.cleanUntilSeconds }),
            },
          });
        });
      }
      if (input.cast_id !== undefined) {
        const view = await designViewOf({
          context,
          job,
          look: { ...input, cast_id: input.cast_id },
        });
        return view.ok ? { content: view.value } : failureResult(view.failure);
      }
      const brief = designBriefLinesOf({
        job,
        viewTool: "check_design",
        answerIn: "design of check_design",
      });
      const pictures = await joinedContent([
        ...job.members.flatMap((entry) =>
          entry.turnaround === undefined
            ? []
            : [
                pictureOf({
                  context,
                  asset: entry.turnaround,
                  label: `The turnaround of ${entry.member.name}, look "${entry.look.id}"`,
                }),
              ],
        ),
        pictureOf({
          context,
          asset,
          label: `The ${isClip ? "clip" : "picture"} "${asset.id}"`,
        }),
      ]);
      if (!pictures.ok) return failureResult(pictures.failure);
      return {
        content: [
          { type: "text", text: brief.join("\n").trim() },
          ...pictures.value,
        ],
      };
    },
  });
}
