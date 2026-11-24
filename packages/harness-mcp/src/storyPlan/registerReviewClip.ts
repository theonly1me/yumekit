import { join } from "node:path";
import type { ClipReview, Edit } from "@yumekit/project";
import { measureClipMotion } from "@yumekit/render";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import type { ClipAnswer } from "../critic/clip/clipAnswerInput.js";
import { clipBriefOf, type ClipJob } from "../critic/clip/clipJob.js";
import { reviewOfAnswer } from "../critic/clip/clipReviewRecord.js";
import type { CriticDesk } from "../critic/criticDesk.js";
import type { AskCritic } from "../critic/criticTypes.js";
import { runCritic } from "../critic/runCritic.js";
import { renderFailureOf } from "../output/renderFailures.js";
import { failureResult } from "../results.js";
import { endPictureEditOf } from "./endPicture.js";
import { measuresOf, planWithReview } from "./reviewRecord.js";
import { reviewClipInput, reviewTargetOf } from "./reviewClipInput.js";

type CriticContext = HarnessContext & {
  critics: CriticDesk;
  askCritic: AskCritic | undefined;
};

async function storeReview(options: {
  context: CriticContext;
  job: ClipJob;
  answer: ClipAnswer;
  measures: ClipReview["measures"];
  seconds: number;
  costUsd: number | undefined;
}) {
  const { context, job, answer } = options;
  const snapshot = context.store.read();
  const ending =
    answer.verdict === "redo"
      ? undefined
      : await endPictureEditOf({
          snapshot,
          projectFolder: context.store.folder,
          clip: job.clip,
          seconds:
            answer.verdict === "cut" ? answer.keep_to_seconds : undefined,
        });
  if (ending !== undefined && !ending.ok) return failureResult(ending.failure);
  const review = reviewOfAnswer({
    ...options,
    endPictureAssetId: ending?.value.assetId,
  });
  const { bible } = snapshot;
  const plan = bible.storyPlan;
  if (plan === undefined) throw new Error("A review target needs a plan.");
  const edits: Edit[] = [
    ...(ending === undefined ? [] : [ending.value.edit]),
    {
      kind: "setBible",
      bible: {
        ...bible,
        storyPlan: planWithReview({ plan, shotId: job.shot.id, review }),
      },
    },
  ];
  const faults =
    review.faults.length === 0 ? "No faults." : review.faults.join("; ");
  const next =
    answer.verdict === "redo"
      ? "You cannot overrule it. Make the clip again with a prompt that names each fault."
      : answer.verdict === "cut"
        ? `Place only ${String(answer.keep_from_seconds)}s to ${String(answer.keep_to_seconds)}s.`
        : "Place it.";
  return applyEditsResult({
    store: context.store,
    edits,
    line: `The critic says ${answer.verdict} for "${job.clip.id}" of shot "${job.shot.id}": ${faults} ${next}`,
    data: {
      verdict: review.verdict,
      faults: review.faults,
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
      critic_seconds: review.critic?.seconds ?? 0,
      ...(options.costUsd === undefined
        ? {}
        : { critic_cost_usd: options.costUsd }),
    },
  });
}

export function registerReviewClip(context: CriticContext): void {
  context.tools.add({
    name: "review_clip",
    description:
      "Have an independent critic review a video clip of a shot before you place it. The critic is a fresh agent that sees only the frames (8 each second), the measures of motion, the shot of the plan, the sheets, and a fixed list. It never sees your prompt. It answers each warning, counts the objects that the facts count, says if the action and each end entry happened, and gives the verdict: keep, cut (with the clean part), or redo. You cannot give or overrule the verdict. A keep or cut saves the end picture for the next shot in the same place. place_video refuses a clip with no keep or cut of the critic. A review takes one to a few minutes.",
    inputSchema: reviewClipInput,
    run: async ({ input, onProgress }) => {
      const snapshot = context.store.read();
      const target = reviewTargetOf({ snapshot, input });
      if (!target.ok) return failureResult(target.failure);
      const { clip, shot, startPicture } = target.value;
      const motion = await measureClipMotion({
        file: join(context.store.folder, clip.file),
        ...(startPicture === undefined
          ? {}
          : { startPicture: join(context.store.folder, startPicture.file) }),
      });
      if (!motion.ok) return failureResult(renderFailureOf(motion.failure));
      const ids = new Set([shot.placeId, ...shot.castIds]);
      const job: ClipJob = {
        kind: "clip",
        ...target.value,
        members: snapshot.bible.cast.filter((member) => ids.has(member.id)),
        pictures: snapshot.assets,
        warnings: motion.value.warnings,
        answer: undefined,
      };
      onProgress?.({ done: 0, message: "The critic looks at the clip" });
      const turn = await runCritic({
        askCritic: context.askCritic,
        critics: context.critics,
        job,
        brief: clipBriefOf(job),
        subject: `the clip "${clip.id}"`,
      });
      if (!turn.ok) return failureResult(turn.failure);
      if (job.answer === undefined) throw new Error("runCritic checks it.");
      return storeReview({
        context,
        job,
        answer: job.answer,
        measures: measuresOf(motion.value),
        seconds: turn.value.seconds,
        costUsd: turn.value.costUsd,
      });
    },
  });
}
