import type { StartReview } from "@yumekit/project";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { failureResult } from "../../results.js";
import { shotNextStepOf } from "../../storyPlan/shotNextStep.js";
import type { CriticDesk } from "../criticDesk.js";
import type { AskCritic } from "../criticTypes.js";
import { runCritic } from "../runCritic.js";
import { inReviewSlot } from "../reviewSlot.js";
import { designChecksOf, designLineOf } from "../design/designRecord.js";
import { startBriefOf } from "./startJob.js";
import {
  reviewStartInput,
  startTargetOf,
  withStartReview,
} from "./startTarget.js";

export function registerReviewStart(
  context: HarnessContext & {
    critics: CriticDesk;
    askCritic: AskCritic | undefined;
  },
): void {
  context.tools.add({
    name: "review_start",
    description:
      "Have the independent critic check a start picture before its clip, and with end_picture_asset_id also the end picture that the clip ends on. A picture becomes an exact frame of the clip, so the critic checks the state of the plan, the framing of the shot, each sheet, anatomy and hands, the known limits, every visible part, and the design check: each person against the turnaround of the look of the shot, question by question. A clip with first_frame_asset_id needs a pass, and with last_frame_asset_id a pass of the same review with that end picture. A picture with a break of the design cannot start or end a clip unless the person chooses it. A refused start picture is a refused try of the shot.",
    inputSchema: reviewStartInput,
    run: ({ input, onProgress }) =>
      inReviewSlot({
        context,
        subject: {
          id: `start:${input.asset_id}`,
          what: "a start picture review",
          subject: `the start picture "${input.asset_id}"`,
          shotId: input.shot_id,
        },
        run: async (ticket) => {
          const snapshot = context.store.read();
          const target = startTargetOf({ snapshot, input });
          if (!target.ok) return failureResult(target.failure);
          const { plan, shot, job } = target.value;
          const { picture } = job;
          const stored = (shot.startReviews ?? []).find(
            (review) =>
              review.assetId === picture.id &&
              review.endPictureAssetId === input.end_picture_asset_id,
          );
          if (stored !== undefined) {
            return failureResult({
              kind: "already-reviewed",
              message: `The critic already said ${stored.verdict} for "${picture.id}"${stored.faults.length === 0 ? "" : `: ${stored.faults.join("; ")}`}.`,
              hint: "A picture that did not change keeps its verdict. Make a new start picture to get a new review.",
            });
          }
          onProgress?.({
            done: 0,
            message: "The critic looks at the start picture",
          });
          const turn = await runCritic({
            askCritic: context.askCritic,
            critics: context.critics,
            ticket,
            job,
            brief: startBriefOf(job),
            subject: `the start picture "${picture.id}"`,
          });
          if (!turn.ok) return failureResult(turn.failure);
          const { answer } = job;
          if (answer === undefined) throw new Error("runCritic checks it.");
          const review: StartReview = {
            assetId: picture.id,
            ...(job.endPicture === undefined
              ? {}
              : { endPictureAssetId: job.endPicture.id }),
            verdict: answer.verdict,
            faults: answer.faults,
            notes: answer.notes,
          };
          const checks =
            job.design === undefined
              ? []
              : designChecksOf({
                  job: job.design,
                  frames: answer.design,
                  by: "critic",
                });
          return context.writeLatest(async () => {
            const latest = context.store.read().bible;
            const latestPlan = latest.storyPlan ?? plan;
            const reviewedShot =
              withStartReview({
                shots: [shot],
                shotId: shot.id,
                review,
                checks,
              })[0] ?? shot;
            const next = checks.some((check) => check.breaks.length > 0)
              ? "A picture that breaks the design cannot start or end a clip unless the person chooses it: make a new picture that matches the turnaround of the look, or ask the person."
              : review.verdict === "pass"
                ? `Make the clip with first_frame_asset_id "${picture.id}"${job.endPicture === undefined ? "" : ` and last_frame_asset_id "${job.endPicture.id}"`}.`
                : shotNextStepOf({
                    shotId: shot.id,
                    reviews: reviewedShot.reviews ?? [],
                    startReviews: reviewedShot.startReviews ?? [],
                  });
            return applyEditsResult({
              store: context.store,
              edits: [
                {
                  kind: "setBible",
                  bible: {
                    ...latest,
                    storyPlan: {
                      ...latestPlan,
                      shots: withStartReview({
                        shots: latestPlan.shots,
                        shotId: shot.id,
                        review,
                        checks,
                      }),
                    },
                  },
                },
              ],
              line: `The critic says ${review.verdict} for the start picture "${picture.id}"${review.faults.length === 0 ? "." : `: ${review.faults.join("; ")}.`}${review.notes.length === 0 ? "" : ` Notes, which do not fail it: ${review.notes.join("; ")}.`}${designLineOf(checks)} ${next}`,
              data: {
                verdict: review.verdict,
                faults: review.faults,
                notes: review.notes,
                design_breaks: checks.flatMap((check) => check.breaks),
              },
            });
          });
        },
      }),
  });
}
