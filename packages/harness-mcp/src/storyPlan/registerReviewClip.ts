import { join } from "node:path";
import { measureClipMotion } from "@yumekit/render";
import { clipBriefOf, type ClipJob } from "../critic/clip/clipJob.js";
import { planNoteLinesOf } from "../critic/plan/planNoteLines.js";
import { runCritic } from "../critic/runCritic.js";
import { inReviewSlot } from "../critic/reviewSlot.js";
import { renderFailureOf } from "../output/renderFailures.js";
import { failureResult } from "../results.js";
import { storedReviewResult } from "./storedReview.js";
import { measuresOf } from "./reviewRecord.js";
import { storeClipReview, type CriticContext } from "./storeClipReview.js";
import {
  requiredSecondsOf,
  shotDesignJobOf,
} from "../critic/design/designJob.js";
import { reviewClipInput, reviewTargetOf } from "./reviewClipInput.js";

export function registerReviewClip(context: CriticContext): void {
  context.tools.add({
    name: "review_clip",
    description:
      "Have an independent critic review a video clip of a shot before you place it. The critic is a fresh agent that sees only the frames (8 each second), the measures of motion, the shot of the plan, the sheets, and a fixed list. It never sees your prompt. It answers each warning, counts the objects that the facts count, says if the action and each end entry happened, and gives each fault with how long it shows, and the verdict: keep, cut (the longest part with no fault), or redo. Its design check counts as the check of the clip, and a break limits place_video to the clean part. Every other fault is a note: you decide. The review saves the end picture for a shot that continues it. A review takes one to a few minutes. Call it in critic mode, or when the person asks for a second look.",
    inputSchema: reviewClipInput,
    run: ({ input, onProgress }) =>
      inReviewSlot({
        context,
        subject: {
          id: `clip:${input.asset_id}`,
          what: "a clip review",
          subject: `the clip "${input.asset_id}"`,
          shotId: input.shot_id,
        },
        run: async (ticket) => {
          const snapshot = context.store.read();
          const target = reviewTargetOf({ snapshot, input });
          if (!target.ok) return failureResult(target.failure);
          const { clip, shot, startPicture } = target.value;
          const stored = (shot.reviews ?? []).findLast(
            (review) => review.by === "critic" && review.assetId === clip.id,
          );
          if (stored !== undefined) return storedReviewResult(stored);
          const motion = await measureClipMotion({
            file: join(context.store.folder, clip.file),
            ...(startPicture === undefined
              ? {}
              : {
                  startPicture: join(context.store.folder, startPicture.file),
                }),
          });
          if (!motion.ok) return failureResult(renderFailureOf(motion.failure));
          const ids = new Set([shot.placeId, ...shot.castIds]);
          const members = snapshot.bible.cast.filter((member) =>
            ids.has(member.id),
          );
          const job: ClipJob = {
            kind: "clip",
            ...target.value,
            members,
            openPlanFaults: planNoteLinesOf({
              plan: snapshot.bible.storyPlan,
              shot,
              members,
            }),
            pictures: snapshot.assets,
            warnings: motion.value.warnings,
            design: shotDesignJobOf({
              snapshot,
              castIds: shot.castIds,
              castLooks: shot.castLooks,
              target: {
                kind: "clip",
                clip,
                lengthSeconds: target.value.lengthSeconds,
                seconds: requiredSecondsOf({
                  lengthSeconds: target.value.lengthSeconds,
                  flagged: motion.value.warnings,
                }),
              },
            }),
            answer: undefined,
          };
          onProgress?.({ done: 0, message: "The critic looks at the clip" });
          const turn = await runCritic({
            askCritic: context.askCritic,
            critics: context.critics,
            ticket,
            job,
            brief: clipBriefOf(job),
            subject: `the clip "${clip.id}"`,
          });
          if (!turn.ok) return failureResult(turn.failure);
          if (job.answer === undefined) throw new Error("runCritic checks it.");
          return storeClipReview({
            context,
            job,
            answer: job.answer,
            measures: measuresOf(motion.value),
            seconds: turn.value.seconds,
            costUsd: turn.value.costUsd,
          });
        },
      }),
  });
}
