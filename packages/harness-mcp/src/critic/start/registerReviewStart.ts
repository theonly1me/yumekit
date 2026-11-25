import type { Shot, StartReview } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { idInput } from "../../inputs.js";
import { failureResult } from "../../results.js";
import { previousEndOf } from "../../storyPlan/continuity.js";
import { planNoteLinesOf } from "../plan/planNoteLines.js";
import { shotNextStepOf } from "../../storyPlan/shotNextStep.js";
import type { CriticDesk } from "../criticDesk.js";
import type { AskCritic } from "../criticTypes.js";
import { runCritic } from "../runCritic.js";
import { inReviewSlot } from "../reviewSlot.js";
import { startBriefOf, type StartJob } from "./startJob.js";

const reviewStartInput = {
  asset_id: idInput("The start picture to check."),
  shot_id: z.string().describe("The shot of the plan that it starts."),
};

function withStartReview(options: {
  shots: Shot[];
  shotId: string;
  review: StartReview;
}): Shot[] {
  return options.shots.map((shot) =>
    shot.id === options.shotId
      ? {
          ...shot,
          startReviews: [
            ...(shot.startReviews ?? []).filter(
              (entry) => entry.assetId !== options.review.assetId,
            ),
            options.review,
          ],
        }
      : shot,
  );
}

export function registerReviewStart(
  context: HarnessContext & {
    critics: CriticDesk;
    askCritic: AskCritic | undefined;
  },
): void {
  context.tools.add({
    name: "review_start",
    description:
      "Have the independent critic check a start picture before its clip. The picture becomes the exact first frame, so the critic checks the start state of the plan, the framing of the shot, each sheet, anatomy and hands, the known limits, and every visible part. A clip with first_frame_asset_id needs a pass. A refused start picture is a refused try of the shot.",
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
          const plan = snapshot.bible.storyPlan;
          const index = (plan?.shots ?? []).findIndex(
            (shot) => shot.id === input.shot_id,
          );
          const shot = plan?.shots[index];
          const picture = snapshot.assets.find(
            (asset) => asset.id === input.asset_id && asset.kind === "image",
          );
          if (
            plan === undefined ||
            shot === undefined ||
            picture === undefined
          ) {
            return failureResult({
              kind: "not-found",
              message: `The plan has no shot "${input.shot_id}", or the project has no picture "${input.asset_id}".`,
              hint: "Give the id of a start picture made with shot_id, and its shot.",
            });
          }
          const stored = (shot.startReviews ?? []).find(
            (review) => review.assetId === picture.id,
          );
          if (stored !== undefined) {
            return failureResult({
              kind: "already-reviewed",
              message: `The critic already said ${stored.verdict} for "${picture.id}"${stored.faults.length === 0 ? "" : `: ${stored.faults.join("; ")}`}.`,
              hint: "A picture that did not change keeps its verdict. Make a new start picture to get a new review.",
            });
          }
          const ids = new Set([shot.placeId, ...shot.castIds]);
          const members = snapshot.bible.cast.filter((member) =>
            ids.has(member.id),
          );
          const previousEnd = previousEndOf({
            snapshot,
            plan,
            shotIndex: index,
          });
          const sheetIds = new Set(
            members.flatMap((member) => member.referenceAssetIds),
          );
          const job: StartJob = {
            kind: "start",
            picture,
            shot,
            members,
            previousEnd,
            openPlanFaults: planNoteLinesOf({ plan, shot, members }),
            pictures: [
              picture,
              ...(previousEnd === undefined ? [] : [previousEnd]),
              ...snapshot.assets.filter((asset) => sheetIds.has(asset.id)),
            ],
            answer: undefined,
          };
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
            verdict: answer.verdict,
            faults: answer.faults,
            notes: answer.notes,
          };
          return context.writeLatest(async () => {
            const latest = context.store.read().bible;
            const latestPlan = latest.storyPlan ?? plan;
            const reviewedShot =
              withStartReview({ shots: [shot], shotId: shot.id, review })[0] ??
              shot;
            const next =
              review.verdict === "pass"
                ? `Make the clip with first_frame_asset_id "${picture.id}".`
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
                      }),
                    },
                  },
                },
              ],
              line: `The critic says ${review.verdict} for the start picture "${picture.id}"${review.faults.length === 0 ? "." : `: ${review.faults.join("; ")}.`}${review.notes.length === 0 ? "" : ` Notes, which do not fail it: ${review.notes.join("; ")}.`} ${next}`,
              data: {
                verdict: review.verdict,
                faults: review.faults,
                notes: review.notes,
              },
            });
          });
        },
      }),
  });
}
