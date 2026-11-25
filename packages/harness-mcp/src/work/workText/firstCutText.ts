import {
  filmMeasureOf,
  type Asset,
  type FilmMeasure,
  type ProjectSnapshot,
  type StoryPlan,
} from "@yumekit/project";
import { lessonsNotSentLine } from "../../storyPlan/lessonsForYou.js";
import { isPlanReviewCurrent, planMembersOf } from "../../storyPlan/planKey.js";
import { sheetTriesOf } from "../../storyPlan/sheetTries.js";
import { sourceTextOf } from "../../storyPlan/tryRules.js";

function costOf(asset: Asset): number | undefined {
  return asset.source.kind === "tool" ? asset.source.costUsd : undefined;
}

export function measureOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): FilmMeasure {
  const { snapshot, plan } = options;
  return filmMeasureOf({
    shots: plan.shots,
    cast: planMembersOf({ bible: snapshot.bible, plan }).map((member) => ({
      ...member,
      sheetTries: sheetTriesOf(member),
    })),
    assets: snapshot.assets.map((asset) => ({
      id: asset.id,
      costUsd: costOf(asset),
      firstFrameAssetId: sourceTextOf({ asset, field: "first_frame_asset_id" }),
    })),
  });
}

export function measureLines(measure: FilmMeasure): string[] {
  const shotTries = measure.shots
    .map(
      (shot) =>
        `${shot.shotId} ${String(shot.tries)}${shot.accepted ? " (accepted)" : ""}`,
    )
    .join(", ");
  const sheetTries = measure.sheets
    .map(
      (sheet) =>
        `${sheet.castId} ${String(sheet.tries)}${sheet.passed ? " (passed)" : sheet.restricted ? " (used with restrictions)" : ""}`,
    )
    .join(", ");
  return [
    `Measure: ${String(measure.acceptedFirstCount)} of ${String(measure.shotCount)} shots accepted on the first try. Money on refused pictures and clips: ${String(Math.round(measure.refusedUsd * 100) / 100)} US dollars.`,
    `Tries of each shot: ${shotTries}.`,
    `Tries of each sheet: ${sheetTries || "none"}.`,
  ];
}

function reviewLine(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): string {
  const { review } = options.plan;
  if (review === undefined) {
    return "Plan check: none. review_plan is advice, for when the person asks for a second look at the plan. Nothing waits for it.";
  }
  const changed = isPlanReviewCurrent({
    bible: options.snapshot.bible,
    plan: options.plan,
  })
    ? ""
    : " The plan or a cast entry changed since.";
  const difficulty = review.shots
    .map((shot) => `${shot.shotId} ${String(shot.difficulty)}`)
    .join(", ");
  const open = options.plan.shots.filter(
    (shot) => (shot.planNotes ?? []).length > 0,
  );
  const notes = [
    ...review.notes,
    ...(open.length === 0
      ? []
      : [
          `the open faults are notes on ${open.map((shot) => `"${shot.id}"`).join(", ")} (get_shot_brief gives them)`,
        ]),
  ];
  return `Plan check (advice): ${review.verdict} by the critic.${changed} Difficulty 1 to 5: ${difficulty}.${notes.length === 0 ? "" : ` Notes: ${notes.join("; ")}.`}`;
}

export const shotBriefLine =
  "Prompts: yumekit sends each prompt as you write it and adds nothing. Before the start picture and the clip of a shot, read get_shot_brief, and write a complete prompt in your own words.";

export function firstCutLines(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): string[] {
  const lessons = options.plan.lessons ?? [];
  return [
    reviewLine(options),
    shotBriefLine,
    ...(lessons.length === 0
      ? []
      : [`Lessons, for you: ${lessonsNotSentLine}`]),
    ...lessons.map(
      (...[lesson, index]) =>
        `Lesson ${String(index + 1)}${lesson.isLimit ? " (a limit)" : ""}: ${lesson.text} (cause: ${lesson.cause})`,
    ),
    ...measureLines(measureOf(options)),
  ];
}
