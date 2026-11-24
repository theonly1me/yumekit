import type { SheetReview, StoryPlan } from "@yumekit/project";
import { sheetTriesOf } from "../../storyPlan/sheetTries.js";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { idInput } from "../../inputs.js";
import { failureResult } from "../../results.js";
import type { CriticDesk } from "../criticDesk.js";
import type { AskCritic } from "../criticTypes.js";
import { runCritic } from "../runCritic.js";
import { sheetBriefOf, type SheetJob } from "./sheetJob.js";
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
    inputSchema: { cast_id: idInput("The cast entry to check.") },
    run: async ({ input, onProgress }) => {
      const snapshot = context.store.read();
      const member = snapshot.bible.cast.find(
        (candidate) => candidate.id === input.cast_id,
      );
      if (member === undefined) {
        return failureResult({
          kind: "cast-not-found",
          message: `The cast has no entry "${input.cast_id}".`,
          hint: `Use one of: ${snapshot.bible.cast.map((candidate) => candidate.id).join(", ") || "none"}.`,
        });
      }
      const pictures = snapshot.assets.filter(
        (asset) =>
          member.referenceAssetIds.includes(asset.id) &&
          (asset.kind === "image" || asset.kind === "video"),
      );
      if (pictures.length === 0) {
        return failureResult({
          kind: "cast-sheet-missing",
          message: `"${member.id}" has no sheet picture to check.`,
          hint: "Make the sheet picture and give it to put_cast_member first.",
        });
      }
      const job: SheetJob = {
        kind: "sheet",
        member,
        pictures,
        holds: heldPropsOf({
          plan: snapshot.bible.storyPlan,
          personId: member.id,
        }),
        answer: undefined,
      };
      onProgress?.({ done: 0, message: "The critic looks at the sheet" });
      const turn = await runCritic({
        askCritic: context.askCritic,
        critics: context.critics,
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
        assetIds: member.referenceAssetIds,
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
        {
          assetIds: member.referenceAssetIds,
          verdict: answer.verdict,
          faults: answer.faults,
          notes: answer.notes,
        },
      ];
      const latest = context.store.read().bible;
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: {
              ...latest,
              cast: latest.cast.map((candidate) =>
                candidate.id === member.id
                  ? { ...candidate, sheetReview: review, sheetTries: tries }
                  : candidate,
              ),
            },
          },
        ],
        line: `The critic says ${answer.verdict} for the sheet of "${member.id}"${answer.faults.length === 0 ? "." : `: ${answer.faults.join("; ")}.`}${answer.notes.length === 0 ? "" : ` Notes, which do not fail it: ${answer.notes.join("; ")}.`} ${sheetNextStepOf({ castId: member.id, tries })}`,
        data: {
          verdict: answer.verdict,
          faults: answer.faults,
          notes: answer.notes,
          tries: tries.length,
        },
      });
    },
  });
}
