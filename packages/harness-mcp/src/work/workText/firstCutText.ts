import {
  filmMeasureOf,
  type Asset,
  type FilmMeasure,
  type ProjectSnapshot,
  type StoryPlan,
} from "@yumekit/project";
import { planMembersOf } from "../../storyPlan/planKey.js";
import { isPlanCheckUsedUp } from "../../critic/plan/openPlanFaults.js";
import { isPlanReviewCurrent } from "../../storyPlan/planGate.js";
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
    return "Plan check: not checked by the critic yet. Sheet pictures can start now. A start picture or a clip runs after review_plan passes, or after two failed checks, when the check is used up.";
  }
  if (isPlanCheckUsedUp(options.plan)) {
    const open = options.plan.shots.filter(
      (shot) => (shot.planNotes ?? []).length > 0,
    );
    return `Plan check: used up after ${String(options.plan.failedPlanChecks ?? 0)} fails, so the paid work goes on. Shots with open plan faults, which the critic checks on each start picture and clip: ${open.map((shot) => `"${shot.id}"`).join(", ") || "none"}. Easiest "${review.easiestShotId}", hardest "${review.hardestShotId}": make them first.`;
  }
  if (
    !isPlanReviewCurrent({ bible: options.snapshot.bible, plan: options.plan })
  ) {
    return `Plan check: ${review.verdict} by the critic, but the plan or a cast entry changed since. Call review_plan again.`;
  }
  const difficulty = review.shots
    .map((shot) => `${shot.shotId} ${String(shot.difficulty)}`)
    .join(", ");
  const verdict =
    review.verdict === "pass"
      ? "passed by the critic"
      : `failed by the critic (${String(options.plan.failedPlanChecks ?? 1)} of 2 checks): ${review.faults.join("; ")}. Correct the plan and call review_plan again; after the second fail, the check is used up and start pictures and clips can run`;
  return `Plan check: ${verdict}. Difficulty 1 to 5: ${difficulty}. Easiest "${review.easiestShotId}", hardest "${review.hardestShotId}": make them first.${review.notes.length === 0 ? "" : ` Notes: ${review.notes.join("; ")}.`}`;
}

export function firstCutLines(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): string[] {
  const lessons = options.plan.lessons ?? [];
  return [
    reviewLine(options),
    ...lessons.map(
      (...[lesson, index]) =>
        `Lesson ${String(index + 1)}${lesson.isLimit ? " (a limit)" : ""}: ${lesson.text} (cause: ${lesson.cause})`,
    ),
    ...measureLines(measureOf(options)),
  ];
}
