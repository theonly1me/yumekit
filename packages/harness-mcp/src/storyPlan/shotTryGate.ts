import type { ProjectSnapshot, Shot } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { endPictureTool } from "./endPicture.js";
import { withReviewedPrompt } from "./promptPlan.js";
import {
  criticReviewsOf,
  refusalsOf,
  refusedStartOf,
  type Refusal,
} from "./shotRefusals.js";
import {
  reviewFirst,
  simplifyFirst,
  sourceIdsOf,
  sourceTextOf,
  tryStepOf,
  triesUsedUp,
} from "./tryRules.js";

export { criticReviewsOf } from "./shotRefusals.js";

type RequestOutcome = Outcome<GenerateAssetInput, HarnessFailure>;

function startsFrom(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
  pictureId: string;
}): boolean {
  const { request, pictureId, snapshot } = options;
  const references = request.reference_asset_ids ?? [];
  if (request.capability === "image") return references.includes(pictureId);
  const first = snapshot.assets.find(
    (asset) => asset.id === request.first_frame_asset_id,
  );
  return (
    request.first_frame_asset_id === pictureId ||
    sourceIdsOf({ asset: first, field: "reference_asset_ids" }).includes(
      pictureId,
    )
  );
}

function stepFailure(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  request: GenerateAssetInput;
  refusals: Refusal[];
}): HarnessFailure | undefined {
  const { snapshot, shot, request, refusals } = options;
  const step = tryStepOf(refusals.length);
  const subject = `Shot "${shot.id}"`;
  if (step === "first") return undefined;
  if (step === "simplify") {
    return (request.simpler_form ?? "").trim() === ""
      ? simplifyFirst(subject)
      : undefined;
  }
  if (step === "used-up") {
    const best = refusals.reduce((...[chosen, refusal]) =>
      refusal.faults.length <= chosen.faults.length ? refusal : chosen,
    );
    return triesUsedUp({
      subject,
      best: `Its best try is "${best.assetId}", with ${String(best.faults.length)} blocking faults.`,
      aroundIt:
        "Restage the shot as a new shot of the plan with a simpler action, or drop it, and call review_plan again. The next shots do not wait for it.",
    });
  }
  const start = refusedStartOf({ snapshot, refusal: refusals.at(-1) });
  const isNewStart =
    request.capability === "video" &&
    refusals.at(-1)?.kind === "start" &&
    request.first_frame_asset_id !== start;
  if (start === undefined || isNewStart) return undefined;
  if (startsFrom({ snapshot, request, pictureId: start })) return undefined;
  return {
    kind: "start-from-refused",
    message: `${subject} was refused once. The second try starts from the refused version and changes only the named faults.`,
    hint: `Make a new start picture with "${start}" in reference_asset_ids and "change only: <each fault>", or use "${start}" as first_frame_asset_id when only the clip failed.`,
  };
}

function isEndPicture(options: {
  snapshot: ProjectSnapshot;
  assetId: string;
}): boolean {
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === options.assetId,
  );
  return asset?.source.kind === "tool" && asset.source.tool === endPictureTool;
}

export function startGateFailureOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  request: GenerateAssetInput;
}): HarnessFailure | undefined {
  const { snapshot, shot, request } = options;
  const first = request.first_frame_asset_id;
  if (request.capability !== "video" || first === undefined) return undefined;
  if (isEndPicture({ snapshot, assetId: first })) return undefined;
  const review = (shot.startReviews ?? []).find(
    (candidate) => candidate.assetId === first,
  );
  if (review === undefined) {
    return {
      kind: "start-not-reviewed",
      message: `The start picture "${first}" becomes the exact first frame of the clip, and the critic has not checked it for shot "${shot.id}".`,
      hint: `Call review_start with asset_id "${first}" and shot_id "${shot.id}" first.`,
    };
  }
  if (review.verdict === "pass") return undefined;
  return {
    kind: "start-failed-review",
    message: `The critic failed the start picture "${first}": ${review.faults.join("; ")}.`,
    hint: "Make the next start picture by the rule of tries, and review it with review_start.",
  };
}

function waitingFailure(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  request: GenerateAssetInput;
}): HarnessFailure | undefined {
  const { snapshot, shot, request } = options;
  const clipIds = new Set(
    criticReviewsOf(shot).map((review) => review.assetId),
  );
  const startIds = new Set(
    (shot.startReviews ?? []).map((review) => review.assetId),
  );
  const kind = request.capability === "video" ? "video" : "image";
  const waiting = snapshot.assets.some(
    (asset) =>
      asset.kind === kind &&
      sourceTextOf({ asset, field: "shot_id" }) === shot.id &&
      !(kind === "video" ? clipIds : startIds).has(asset.id),
  );
  if (!waiting) return undefined;
  return reviewFirst({
    subject: `Shot "${shot.id}"`,
    tool: kind === "video" ? "review_clip" : "review_start",
  });
}

export function withShotTry(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
  request: GenerateAssetInput;
}): RequestOutcome {
  const { snapshot, shot, request } = options;
  const waiting = waitingFailure(options);
  if (waiting !== undefined) return { ok: false, failure: waiting };
  if (request.person_asked_for_another_try === true) {
    return { ok: true, value: request };
  }
  const refusals = refusalsOf({
    shot,
    order: snapshot.assets.map((asset) => asset.id),
  });
  const failure = stepFailure({ snapshot, shot, request, refusals });
  if (failure !== undefined) return { ok: false, failure };
  if (refusals.length > 0) return { ok: true, value: request };
  const planned =
    request.capability === "video" ? shot.videoPrompt : shot.startPicturePrompt;
  return withReviewedPrompt({
    request,
    planned: planned === undefined ? [] : [planned],
    made: snapshot.assets.filter(
      (asset) =>
        sourceTextOf({ asset, field: "shot_id" }) === shot.id &&
        asset.kind === (request.capability === "video" ? "video" : "image"),
    ),
    subject: `shot "${shot.id}"`,
  });
}
