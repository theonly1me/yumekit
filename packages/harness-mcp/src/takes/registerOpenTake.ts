import {
  chaptersOf,
  filmChapterId,
  openTakeOf,
  takeStepNames,
  takeSteps,
  type ProjectSnapshot,
  type Take,
  type TakeStep,
} from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import {
  failureResult,
  successResult,
  type HarnessFailure,
  type Outcome,
} from "../results.js";

export function newTakeIdOf(takes: readonly Take[]): string {
  const highest = Math.max(
    0,
    ...takes.map((take) => Number(/^take-(\d+)$/.exec(take.id)?.[1] ?? 0)),
  );
  return `take-${String(highest + 1)}`;
}

function chapterOf(options: {
  snapshot: ProjectSnapshot;
  step: TakeStep;
  chapterId: string | undefined;
}): Outcome<string | undefined, HarnessFailure> {
  const { step, chapterId } = options;
  const chapters = chaptersOf(options.snapshot.bible.storyPlan);
  const named = chapters.map((chapter) => `"${chapter.id}"`).join(", ");
  if (step === "story") {
    return chapterId === undefined
      ? { ok: true, value: undefined }
      : {
          ok: false,
          failure: {
            kind: "invalid-value",
            message: "A take of the story belongs to no chapter.",
            hint: "Call open_take with step story and no chapter_id.",
          },
        };
  }
  const id = chapterId ?? (chapters.length === 1 ? chapters[0]?.id : undefined);
  if (id !== undefined && chapters.some((chapter) => chapter.id === id)) {
    return { ok: true, value: id };
  }
  return {
    ok: false,
    failure: {
      kind: "chapter-not-found",
      message:
        chapterId === undefined
          ? `The film has ${String(chapters.length)} chapters, so the take needs chapter_id.`
          : `The film has no chapter "${chapterId}".`,
      hint: `Give chapter_id, one of: ${named}. A plan with no chapters has the one chapter "${filmChapterId}".`,
    },
  };
}

const takeStepsText =
  "story (the story for the person to approve), pictures (sheets, places, props, start and end pictures), clips (the clips and the music), or cut (the cut of the chapter from render_video with chapter_id)";

export function registerOpenTake(context: HarnessContext): void {
  context.tools.add({
    name: "open_take",
    description: `Open a take: one round of your work for one chapter and one step, which the person reviews. While the take is open, each picture, clip, music, or sound that generate_asset or generate_assets makes joins it, and render_video with chapter_id adds the cut. When the round is done, call ready_take with your note on each item, then end your turn: the person marks only what needs a change and sends the take, and the notes come back as the next request. One take is open at a time. Give chapter_id for each step but the story; a plan with no chapters is the one chapter "${filmChapterId}".`,
    inputSchema: {
      step: z.enum(takeSteps).describe(`The step: ${takeStepsText}.`),
      chapter_id: idInput(
        "The chapter of the take, from the chapters of get_work. Leave it out for the story, or when the film has one chapter.",
      ).optional(),
    },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const chapter = chapterOf({
        snapshot,
        step: input.step,
        chapterId: input.chapter_id,
      });
      if (!chapter.ok) return failureResult(chapter.failure);
      const open = openTakeOf(snapshot.takes);
      const data = (take: Pick<Take, "id" | "number">) => ({
        take_id: take.id,
        number: take.number,
        step: input.step,
        ...(chapter.value === undefined ? {} : { chapter_id: chapter.value }),
      });
      if (open?.step === input.step && open.chapterId === chapter.value) {
        return successResult({
          line: `Take ${String(open.number)} is already open for ${takeStepNames[input.step]}, with ${String(open.items.length)} items.`,
          data: data(open),
        });
      }
      if (open !== undefined && open.items.length > 0) {
        return failureResult({
          kind: "take-already-open",
          message: `Take ${String(open.number)} ("${open.id}") is open for ${takeStepNames[open.step]} with ${String(open.items.length)} items.`,
          hint: "Call ready_take for that take first, so the person can review it.",
        });
      }
      const takeId = newTakeIdOf(snapshot.takes);
      const number =
        snapshot.takes.filter(
          (take) => take !== open && take.chapterId === chapter.value,
        ).length + 1;
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "openTake",
            takeId,
            ...(chapter.value === undefined
              ? {}
              : { chapterId: chapter.value }),
            step: input.step,
            at: new Date().toISOString(),
          },
        ],
        line: `Take ${String(number)} is open for ${takeStepNames[input.step]}${chapter.value === undefined ? "" : ` of chapter "${chapter.value}"`}. Each picture, clip, or sound that you make now joins it. When the round is done, call ready_take with your note on each item.`,
        data: data({ id: takeId, number }),
      });
    },
  });
}
