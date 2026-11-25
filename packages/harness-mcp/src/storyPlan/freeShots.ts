import type { ProjectSnapshot, Shot, StoryPlan } from "@yumekit/project";
import { continuedShotOf, keptReviewOf } from "./continuity.js";
import { calibrationFailureOf, planGateFailureOf } from "./planGate.js";
import { sheetFailureOf } from "./sheets.js";
import { refusalsOf } from "./shotRefusals.js";

export type ShotWait =
  { kind: "done" } | { kind: "free" } | { kind: "waits"; reason: string };

function shotWaitOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  shot: Shot;
}): ShotWait {
  const { snapshot, plan, shot } = options;
  if (keptReviewOf(shot.reviews) !== undefined) return { kind: "done" };
  if (planGateFailureOf({ bible: snapshot.bible, plan, shot }) !== undefined) {
    return { kind: "waits", reason: "the plan check" };
  }
  const calibration = calibrationFailureOf({ plan, shot });
  if (calibration !== undefined) {
    return {
      kind: "waits",
      reason:
        calibration.kind === "lessons-missing"
          ? "a lesson of the calibration shots (record_lesson)"
          : "the two calibration shots",
    };
  }
  const before = continuedShotOf({ plan, shot });
  if (
    before !== undefined &&
    keptReviewOf(before.reviews) === undefined &&
    refusalsOf({ shot: before }).length === 0
  ) {
    return { kind: "waits", reason: `shot "${before.id}" (continues_shot)` };
  }
  if (sheetFailureOf({ snapshot, shot }) !== undefined) {
    return { kind: "waits", reason: "a passed sheet of its place or cast" };
  }
  return { kind: "free" };
}

export function freeShotLines(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): string[] {
  const waits = options.plan.shots.map((shot) => ({
    shot,
    wait: shotWaitOf({ ...options, shot }),
  }));
  const free = waits.filter((entry) => entry.wait.kind === "free");
  const waiting = waits.flatMap((entry) =>
    entry.wait.kind === "waits"
      ? [`"${entry.shot.id}" waits for ${entry.wait.reason}`]
      : [],
  );
  return [
    `Free shots now: ${free.map((entry) => `"${entry.shot.id}"`).join(", ") || "none"}. Make their start pictures in one generate_assets call, review them in one review_several call, then their clips the same way.`,
    ...(waiting.length === 0 ? [] : [`Waiting: ${waiting.join("; ")}.`]),
  ];
}
