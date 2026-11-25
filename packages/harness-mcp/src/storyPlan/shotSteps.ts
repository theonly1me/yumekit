import type { Asset, ProjectSnapshot, Shot, StoryPlan } from "@yumekit/project";
import { designCheckOf } from "../critic/design/designRecord.js";
import {
  clipEndIdOf,
  continuedShotOf,
  startsFromPlanOf,
} from "./continuity.js";
import { isOpen, shortestCleanSeconds, shotNeedsDesign } from "./designGate.js";
import { sheetLacksOf } from "./sheets.js";
import { sourceTextOf } from "./tryRules.js";

export const batchSteps = [
  "sheets",
  "start",
  "check-start",
  "clip",
  "check-clip",
] as const;

export type BatchStep = (typeof batchSteps)[number];

export type ShotStep =
  | { kind: BatchStep; shotId: string; assetId?: string }
  | { kind: "waits"; shotId: string; reason: string }
  | { kind: "done"; shotId: string };

function shotAssetsOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  kind: "image" | "video";
}): Asset[] {
  return options.snapshot.assets.filter(
    (asset) =>
      asset.kind === options.kind &&
      sourceTextOf({ asset, field: "shot_id" }) === options.shot.id &&
      sourceTextOf({ asset, field: "key_picture" }) !== "end",
  );
}

function clipStepOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  needsDesign: boolean;
}): ShotStep | undefined {
  const { snapshot, shot } = options;
  const clip = shotAssetsOf({ snapshot, shot, kind: "video" }).at(-1);
  if (clip === undefined) return undefined;
  const check = designCheckOf({ shot, assetId: clip.id });
  if (options.needsDesign && check === undefined) {
    return { kind: "check-clip", shotId: shot.id, assetId: clip.id };
  }
  const isTooShort =
    check !== undefined &&
    !isOpen(check) &&
    (check.cleanUntilSeconds ?? 0) < shortestCleanSeconds;
  return isTooShort ? undefined : { kind: "done", shotId: shot.id };
}

export function shotStepOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  shot: Shot;
}): ShotStep {
  const { snapshot, shot } = options;
  const shotId = shot.id;
  if (sheetLacksOf({ snapshot, shot }).length > 0) {
    return { kind: "sheets", shotId };
  }
  const needsDesign = shotNeedsDesign({ snapshot, shot });
  const clipStep = clipStepOf({ snapshot, shot, needsDesign });
  if (clipStep !== undefined) return clipStep;
  const before = continuedShotOf(options);
  if (
    before !== undefined &&
    clipEndIdOf(before) === undefined &&
    !startsFromPlanOf({ snapshot, before })
  ) {
    return {
      kind: "waits",
      shotId,
      reason: `the checked clip of "${before.id}" (continues_shot)`,
    };
  }
  const start = shotAssetsOf({ snapshot, shot, kind: "image" }).at(-1);
  if (start === undefined) return { kind: "start", shotId };
  const startCheck = designCheckOf({ shot, assetId: start.id });
  if (needsDesign && startCheck === undefined) {
    return { kind: "check-start", shotId, assetId: start.id };
  }
  return startCheck !== undefined && !isOpen(startCheck)
    ? { kind: "start", shotId }
    : { kind: "clip", shotId, assetId: start.id };
}
