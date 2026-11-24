import { filmMeasureOf, type FilmMeasure } from "@yumekit/project/film-measure";
import type { Snapshot } from "../../engine/snapshot.js";
import type { PlanShot } from "./storyPlanSchema.js";

function sourceText(options: {
  input: Record<string, unknown>;
  field: string;
}): string | undefined {
  const value = options.input[options.field];
  return typeof value === "string" ? value : undefined;
}

export function measureOf(snapshot: Snapshot): FilmMeasure | undefined {
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) return undefined;
  const used = new Set(
    plan.shots.flatMap((shot) => [shot.placeId, ...shot.castIds]),
  );
  return filmMeasureOf({
    shots: plan.shots,
    cast: snapshot.bible.cast.filter((member) => used.has(member.id)),
    assets: snapshot.assets.map((asset) => ({
      id: asset.id,
      costUsd: asset.source.kind === "tool" ? asset.source.costUsd : undefined,
      firstFrameAssetId:
        asset.source.kind === "tool"
          ? sourceText({
              input: asset.source.input,
              field: "first_frame_asset_id",
            })
          : undefined,
    })),
  });
}

export function moneyText(usd: number): string {
  return `${String(Math.round(usd * 100) / 100)} US dollars`;
}

export interface ShotChecks {
  difficultyText: string | undefined;
  triesText: string | undefined;
  startText: string | undefined;
  startFaults: string[];
  notes: string[];
}

export function shotChecksOf(options: {
  snapshot: Snapshot;
  shot: PlanShot;
}): ShotChecks {
  const { shot } = options;
  const plan = options.snapshot.bible.storyPlan;
  const rated = plan?.review?.shots.find((entry) => entry.shotId === shot.id);
  const tries = measureOf(options.snapshot)?.shots.find(
    (entry) => entry.shotId === shot.id,
  )?.tries;
  const start = shot.startReviews?.at(-1);
  return {
    difficultyText:
      rated === undefined
        ? undefined
        : `Difficulty ${String(rated.difficulty)} of 5`,
    triesText:
      tries === undefined || tries === 0
        ? undefined
        : tries === 1
          ? "1 try"
          : `${String(tries)} tries`,
    startText:
      start === undefined
        ? undefined
        : start.verdict === "pass"
          ? "The critic passed the start picture."
          : "The critic failed the start picture.",
    startFaults: start?.verdict === "fail" ? start.faults : [],
    notes: [
      ...(rated?.notes ?? []),
      ...(shot.reviews?.at(-1)?.notes ?? []),
      ...(start?.notes ?? []),
    ],
  };
}
