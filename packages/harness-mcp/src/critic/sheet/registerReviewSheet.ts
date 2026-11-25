import {
  defaultLookId,
  type SheetReview,
  type StoryPlan,
} from "@yumekit/project";
import { sheetTriesOf } from "../../storyPlan/sheetTries.js";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { idInput } from "../../inputs.js";
import { failureResult } from "../../results.js";
import type { CriticDesk } from "../criticDesk.js";
import type { AskCritic } from "../criticTypes.js";
import { runCritic } from "../runCritic.js";
import { inReviewSlot } from "../reviewSlot.js";
import { designChecksOf, designLineOf } from "../design/designRecord.js";
import { sheetBriefOf } from "./sheetJob.js";
import {
  bibleWithMember,
  memberWithLookReview,
  sheetTargetOf,
} from "./sheetTarget.js";
import { sheetNextStepOf } from "./sheetNextStep.js";

export function heldPropsOf(options: {
  plan: StoryPlan | undefined;
  personId: string;
}): string[] {
  const held = (options.plan?.shots ?? []).flatMap((shot) =>
    [shot.startState, shot.endState].flatMap((state) =>
      typeof state === "string"
        ? []
        : state.flatMap((entry) =>
            entry.heldBy?.castId === options.personId ? [entry.castId] : [],
          ),
    ),
  );
  return [...new Set(held)];
}

export function registerReviewSheet(
  context: HarnessContext & {
    critics: CriticDesk;
    askCritic: AskCritic | undefined;
  },
): void {
  context.tools.add({
    name: "review_sheet",
    description:
      "Have an independent critic check the sheet of a cast entry against its facts before a shot uses it. The critic counts each object (a prop sheet must show the prop once), checks each fact (the side of a scar, the hand, five fingers), the full body with feet and the height against the hero, its own design and personality (a villain must read as a threat), and the picture of the hands with a prop that the person holds in the plan. A call with shot_id needs a passed sheet review of each entry of the shot, on its current pictures.",
    inputSchema: {
      cast_id: idInput("The cast entry to check."),
      look_id: idInput(
        `The look to check. Default: "${defaultLookId}". The critic checks the turnaround and the hands of the look against the base facts and the clothes and props of the look, and each kit sheet (expressions, poses) against the turnaround, with the design check.`,
      ).optional(),
    },
    run: ({ input, onProgress }) =>
      inReviewSlot({
        context,
        subject: {
          id: `sheet:${input.cast_id}`,
          what: "a sheet review",
          subject: `the sheet of "${input.cast_id}"`,
          castId: input.cast_id,
        },
        run: async (ticket) => {
          const snapshot = context.store.read();
          const target = sheetTargetOf({
            snapshot,
            castId: input.cast_id,
            lookId: input.look_id,
            holds: heldPropsOf({
              plan: snapshot.bible.storyPlan,
              personId: input.cast_id,
            }),
          });
          if (!target.ok) return failureResult(target.failure);
          const { member, lookId, classicIds, job } = target.value;
          const isDefault = lookId === defaultLookId;
          onProgress?.({ done: 0, message: "The critic looks at the sheet" });
          const turn = await runCritic({
            askCritic: context.askCritic,
            critics: context.critics,
            ticket,
            job,
            brief: sheetBriefOf(job),
            subject: `the sheet of "${member.id}"`,
          });
          if (!turn.ok) return failureResult(turn.failure);
          const { answer } = job;
          if (answer === undefined) throw new Error("runCritic checks it.");
          const review: SheetReview = {
            verdict: answer.verdict,
            faults: answer.faults,
            assetIds: classicIds,
            counts: answer.counts.map((count) => ({
              object: count.object,
              expected: count.expected,
              seen: count.seen,
            })),
            answers: answer.checks,
            notes: answer.notes,
          };
          const tries = [
            ...sheetTriesOf(member),
            ...(isDefault
              ? [
                  {
                    assetIds: classicIds,
                    verdict: answer.verdict,
                    faults: answer.faults,
                    notes: answer.notes,
                  },
                ]
              : []),
          ];
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
            const current =
              latest.cast.find((candidate) => candidate.id === member.id) ??
              member;
            const reviewed = memberWithLookReview({
              member: isDefault
                ? { ...current, sheetReview: review, sheetTries: tries }
                : current,
              lookId,
              review,
              checks,
            });
            return applyEditsResult({
              store: context.store,
              edits: [
                {
                  kind: "setBible",
                  bible: bibleWithMember({ bible: latest, member: reviewed }),
                },
              ],
              line: `The critic says ${answer.verdict} for the sheet of "${member.id}"${isDefault ? "" : ` in the look "${lookId}"`}${answer.faults.length === 0 ? "." : `: ${answer.faults.join("; ")}.`}${answer.notes.length === 0 ? "" : ` Notes, which do not fail it: ${answer.notes.join("; ")}.`}${designLineOf(checks)} ${sheetNextStepOf({ castId: member.id, tries })}`,
              data: {
                verdict: answer.verdict,
                faults: answer.faults,
                notes: answer.notes,
                tries: tries.length,
                design_breaks: checks.flatMap((check) => check.breaks),
              },
            });
          });
        },
      }),
  });
}
