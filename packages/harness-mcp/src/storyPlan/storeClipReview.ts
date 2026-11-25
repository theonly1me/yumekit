import type {
  ClipReview,
  DesignCheck,
  Edit,
  StoryPlan,
} from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import type { ClipAnswer } from "../critic/clip/clipAnswerInput.js";
import type { ClipJob } from "../critic/clip/clipJob.js";
import { reviewOfAnswer } from "../critic/clip/clipReviewRecord.js";
import type { CriticDesk } from "../critic/criticDesk.js";
import type { AskCritic } from "../critic/criticTypes.js";
import {
  designChecksOf,
  designLineOf,
  withDesignChecks,
} from "../critic/design/designRecord.js";
import { failureResult } from "../results.js";
import { endPictureEditOf } from "./endPicture.js";
import { planWithReview } from "./reviewRecord.js";
import { shotNextStepOf } from "./shotNextStep.js";

function withShotDesign(options: {
  plan: StoryPlan;
  shotId: string;
  checks: DesignCheck[];
}): StoryPlan {
  return {
    ...options.plan,
    shots: options.plan.shots.map((shot) =>
      shot.id === options.shotId
        ? withDesignChecks({ shot, checks: options.checks })
        : shot,
    ),
  };
}

export type CriticContext = HarnessContext & {
  critics: CriticDesk;
  askCritic: AskCritic | undefined;
};

export async function storeClipReview(options: {
  context: CriticContext;
  job: ClipJob;
  answer: ClipAnswer;
  measures: ClipReview["measures"];
  seconds: number;
  costUsd: number | undefined;
}) {
  const { context, job, answer } = options;
  const snapshot = context.store.read();
  const checks =
    job.design === undefined
      ? []
      : designChecksOf({
          job: job.design,
          frames: answer.design,
          by: "critic",
        });
  const cleanUntil = checks.find(
    (check) => check.cleanUntilSeconds !== undefined,
  )?.cleanUntilSeconds;
  const keepTo = answer.verdict === "cut" ? answer.keep_to_seconds : undefined;
  const ending =
    answer.verdict === "redo"
      ? undefined
      : await endPictureEditOf({
          snapshot,
          projectFolder: context.store.folder,
          clip: job.clip,
          seconds:
            cleanUntil === undefined
              ? keepTo
              : Math.min(keepTo ?? cleanUntil, cleanUntil),
        });
  if (ending !== undefined && !ending.ok) return failureResult(ending.failure);
  const review = reviewOfAnswer({
    ...options,
    endPictureAssetId: ending?.value.assetId,
  });
  const editsOf = (): Edit[] => {
    const { bible } = context.store.read();
    const plan = bible.storyPlan;
    if (plan === undefined) throw new Error("A review target needs a plan.");
    return [
      ...(ending === undefined ? [] : [ending.value.edit]),
      {
        kind: "setBible",
        bible: {
          ...bible,
          storyPlan: withShotDesign({
            plan: planWithReview({ plan, shotId: job.shot.id, review }),
            shotId: job.shot.id,
            checks,
          }),
        },
      },
    ];
  };
  const notes =
    (review.notes ?? []).length === 0
      ? ""
      : ` Notes, which do not refuse it: ${(review.notes ?? []).join("; ")}.`;
  const faults = `${review.faults.length === 0 ? "No blocking faults." : review.faults.join("; ")}${notes}`;
  const next =
    answer.verdict === "redo"
      ? shotNextStepOf({
          shotId: job.shot.id,
          reviews: [...(job.shot.reviews ?? []), review],
        })
      : answer.verdict === "cut"
        ? `Place only ${String(answer.keep_from_seconds)}s to ${String(answer.keep_to_seconds)}s.`
        : "Place it.";
  return context.writeLatest(() =>
    applyEditsResult({
      store: context.store,
      edits: editsOf(),
      line: `The critic says ${answer.verdict} for "${job.clip.id}" of shot "${job.shot.id}": ${faults}${designLineOf(checks)} ${next}${cleanUntil === undefined ? "" : ` place_video takes only the part up to ${String(cleanUntil)}s (duration_frames), unless the person chooses the whole clip.`}`,
      data: {
        verdict: review.verdict,
        faults: review.faults,
        notes: review.notes ?? [],
        missed: review.critic?.missed ?? [],
        ...(review.keepFromSeconds === undefined
          ? {}
          : { keep_from_seconds: review.keepFromSeconds }),
        ...(review.keepToSeconds === undefined
          ? {}
          : { keep_to_seconds: review.keepToSeconds }),
        ...(review.endPictureAssetId === undefined
          ? {}
          : { end_picture_asset_id: review.endPictureAssetId }),
        measures: review.measures,
        design_breaks: checks.flatMap((check) => check.breaks),
        ...(cleanUntil === undefined
          ? {}
          : { clean_until_seconds: cleanUntil }),
        critic_seconds: review.critic?.seconds ?? 0,
        ...(options.costUsd === undefined
          ? {}
          : { critic_cost_usd: options.costUsd }),
      },
    }),
  );
}
