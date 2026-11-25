import {
  checkModeOf,
  type CheckMode,
  type ProjectSnapshot,
  type StoryPlan,
} from "@yumekit/project";
import { toolNameByCapability } from "../media/generateAssetInput.js";
import { planMembersOf } from "./planKey.js";
import {
  batchSteps,
  shotStepOf,
  type BatchStep,
  type ShotStep,
} from "./shotSteps.js";

function quoted(ids: string[]): string {
  return ids.map((id) => `"${id}"`).join(", ");
}

function howOf(options: {
  step: BatchStep;
  checks: CheckMode;
  assetIds: string[];
}): string {
  const { step, checks, assetIds } = options;
  const byCritic = checks === "critic";
  switch (step) {
    case "sheets":
      return "Make every sheet picture in one generate_assets call (sheet_of, and no input.prompt to send the sheet_prompts), then give each to put_cast_member.";
    case "start":
      return "Make their start pictures in one generate_assets call (capability image, shot_id). Read get_shot_brief first.";
    case "check-start":
      return byCritic
        ? `Check ${quoted(assetIds)} in one review_several call with review_start.`
        : `Check the design of ${quoted(assetIds)} in one check_design call.`;
    case "clip":
      return `Make their clips in one generate_assets call (capability video, shot_id, first_frame_asset_id ${quoted(assetIds)}).`;
    case "check-clip":
      return byCritic
        ? `Check ${quoted(assetIds)} in one review_several call with review_clip.`
        : `Check the design of ${quoted(assetIds)} in one check_design call.`;
  }
}

const stepNames: Record<BatchStep, string> = {
  sheets: "the sheets",
  start: "the start pictures",
  "check-start": "the check of the start pictures",
  clip: "the clips",
  "check-clip": "the check of the clips",
};

function sheetsReadyLine(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): string {
  const members = planMembersOf({
    bible: options.snapshot.bible,
    plan: options.plan,
  }).filter((member) => member.referenceAssetIds.length === 0);
  const ready = members.filter(
    (member) =>
      (member.facts ?? []).length > 0 && (member.sheetPrompts ?? []).length > 0,
  );
  const unready = members.filter((member) => !ready.includes(member));
  return `Ready: ${quoted(ready.map((member) => member.id)) || "none"}.${unready.length === 0 ? "" : ` First give facts and sheet_prompts to ${quoted(unready.map((member) => member.id))} with put_cast_member.`}`;
}

function hasMusic(snapshot: ProjectSnapshot): boolean {
  return snapshot.assets.some(
    (asset) =>
      asset.source.kind === "tool" &&
      asset.source.tool === toolNameByCapability.music,
  );
}

export function nextBatchLines(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
}): string[] {
  const { snapshot, plan } = options;
  const checks = checkModeOf(snapshot.project);
  const steps: ShotStep[] = plan.shots.map((shot) =>
    shotStepOf({ ...options, shot }),
  );
  const waiting = steps.flatMap((step) =>
    step.kind === "waits" ? [`"${step.shotId}" waits for ${step.reason}`] : [],
  );
  const step = batchSteps.find((candidate) =>
    steps.some((entry) => entry.kind === candidate),
  );
  const waitLine =
    waiting.length === 0 ? [] : [`Waiting: ${waiting.join("; ")}.`];
  if (step === undefined) {
    if (waiting.length > 0) return waitLine;
    return hasMusic(snapshot)
      ? [
          "Next batch: the edit. Place each clip, the cards, and the music, then render.",
        ]
      : [
          "Next batch: the music. Make the candidates in one generate_assets call, check each with check_music, and place the best with replace_music.",
        ];
  }
  const batch = steps.filter((entry) => entry.kind === step);
  const assetIds = batch.flatMap((entry) =>
    "assetId" in entry ? [entry.assetId] : [],
  );
  const ready =
    step === "sheets"
      ? sheetsReadyLine(options)
      : `Ready: ${quoted(batch.map((entry) => entry.shotId))}.`;
  return [
    `Next batch: ${stepNames[step]}. ${ready} ${howOf({ step, checks, assetIds })}`,
    ...waitLine,
  ];
}
