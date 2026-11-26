import type { Chapter, Edit, StoryPlan } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { hasVoiceClip } from "../sceneClips/rowChangeResult.js";
import { chapterInput } from "../storyPlan/chapterInput.js";
import { rowOrderChangesOf } from "./filmOrder.js";

const chapterHint =
  "Give every chapter in film order, with each shot of the plan in exactly one chapter. Call get_work to see the shots and the chapters.";

function isNewOrder(options: {
  planShotIds: string[];
  shotIds: string[];
}): boolean {
  const { planShotIds, shotIds } = options;
  const sameShots =
    shotIds.length === planShotIds.length &&
    new Set(shotIds).size === shotIds.length &&
    shotIds.every((shotId) => planShotIds.includes(shotId));
  return (
    sameShots &&
    shotIds.some((...[shotId, index]) => shotId !== planShotIds[index])
  );
}

function reorderedPlanEdit(options: {
  plan: StoryPlan;
  shotIds: string[];
  bible: Extract<Edit, { kind: "setBible" }>["bible"];
}): Edit {
  const { plan, shotIds } = options;
  const storyPlan = {
    ...plan,
    shots: plan.shots.toSorted(
      (...[first, second]) =>
        shotIds.indexOf(first.id) - shotIds.indexOf(second.id),
    ),
  };
  delete storyPlan.chapters;
  return { kind: "setBible", bible: { ...options.bible, storyPlan } };
}

function chaptersLine(chapters: Chapter[]): string {
  const named = chapters
    .map(
      (...[chapter, index]) =>
        `${String(index + 1)}. "${chapter.title}" (${String(chapter.shotIds.length)} ${chapter.shotIds.length === 1 ? "shot" : "shots"})`,
    )
    .join(", ");
  return `The film has ${String(chapters.length)} ${chapters.length === 1 ? "chapter" : "chapters"}: ${named}.`;
}

export function registerSetChapters(context: HarnessContext): void {
  context.tools.add({
    name: "set_chapters",
    description:
      "Replace the chapters of the story plan: rename, split, or join chapters, move the line between two chapters, move a chapter, or move a shot to another chapter. Give every chapter in film order, each with its shots in film order, and each shot of the plan in exactly one chapter. When the shots keep the order of the plan, only the chapters change. When a chapter or a shot moves to another place, the plan takes the new order of the shots, and the scenes row of each output follows: the clip of each shot moves with its shot and with the sound of its video, a clip with no shot stays after the clip before it, and the clips play end to end. One undo reverts the whole change. To change the shots themselves, call set_story_plan.",
    inputSchema: {
      chapters: z
        .array(chapterInput)
        .min(1)
        .max(40)
        .describe("Every chapter of the film, in film order."),
    },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const plan = snapshot.bible.storyPlan;
      if (plan === undefined) {
        return failureResult({
          kind: "no-story-plan",
          message:
            "The project has no story plan, so it has no shots to split.",
          hint: "Write the plan with set_story_plan first.",
        });
      }
      const chapters: Chapter[] = input.chapters.map((chapter) => ({
        id: chapter.chapter_id,
        title: chapter.title,
        shotIds: chapter.shot_ids,
      }));
      const shotIds = chapters.flatMap((chapter) => chapter.shotIds);
      const orderChanges = isNewOrder({
        planShotIds: plan.shots.map((shot) => shot.id),
        shotIds,
      });
      const rowChanges = orderChanges
        ? rowOrderChangesOf({ snapshot, shotIds })
        : [];
      const voiceMayNotMatch = rowChanges.some((change) =>
        hasVoiceClip({ snapshot, timeline: change.timeline }),
      );
      return applyEditsResult({
        store: context.store,
        edits: [
          ...(orderChanges
            ? [reorderedPlanEdit({ plan, shotIds, bible: snapshot.bible })]
            : []),
          { kind: "setChapters", chapters },
          ...rowChanges.map((change) => change.edit),
        ],
        line: `${chaptersLine(chapters)}${orderChanges ? " The shots of the plan and the scenes of each output follow the new order." : ""}${voiceMayNotMatch ? " The voice may not match the scenes now." : ""}`,
        data: {
          chapters: chapters.map((chapter) => ({
            chapter_id: chapter.id,
            shot_ids: chapter.shotIds,
          })),
          order_changed: orderChanges,
          output_ids: rowChanges.map((change) => change.timeline.outputId),
          voice_may_not_match: voiceMayNotMatch,
        },
        hints: {
          "chapter-misses-shot": chapterHint,
          "shot-in-two-chapters": chapterHint,
          "chapters-break-order": chapterHint,
          "not-found": chapterHint,
          "id-in-use": "Give each chapter its own chapter_id.",
        },
      });
    },
  });
}
