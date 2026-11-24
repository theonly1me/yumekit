import {
  videoStyleOf,
  type ProjectSnapshot,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { continuityFailureOf } from "./continuity.js";
import {
  calibrationFailureOf,
  calibrationShotIdsOf,
  planGateFailureOf,
} from "./planGate.js";
import { firstFrameFailureOf, withPromptAdditions } from "./promptAdditions.js";
import { withSheetTry } from "./sheetTryGate.js";
import { sheetFailureOf } from "./sheets.js";
import { refusalsOf } from "./shotRefusals.js";
import { startGateFailureOf, withShotTry } from "./shotTryGate.js";

type RequestOutcome = Outcome<GenerateAssetInput, HarnessFailure>;

function failed(failure: HarnessFailure): RequestOutcome {
  return { ok: false, failure };
}

function needsShot(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): boolean {
  const { snapshot } = options;
  if (options.request.capability !== "video") return false;
  const style = videoStyleOf(snapshot.project);
  return (
    style === "ai-video" ||
    style === "mix" ||
    snapshot.bible.storyPlan !== undefined
  );
}

function planMissing(): HarnessFailure {
  return {
    kind: "story-plan-missing",
    message:
      "This project has no story plan, and a video clip of a film needs a shot of the plan.",
    hint: "Read get_story_guide, write the plan with set_story_plan, then call again with shot_id.",
  };
}

function shotOf(options: {
  plan: StoryPlan;
  shotId: string;
}): Outcome<{ shot: Shot; index: number }, HarnessFailure> {
  const index = options.plan.shots.findIndex(
    (candidate) => candidate.id === options.shotId,
  );
  const shot = options.plan.shots[index];
  if (shot !== undefined) return { ok: true, value: { shot, index } };
  return {
    ok: false,
    failure: {
      kind: "shot-not-found",
      message: `The story plan has no shot "${options.shotId}".`,
      hint: `Use one of these shot ids: ${options.plan.shots.map((candidate) => candidate.id).join(", ")}. Or add the shot with set_story_plan.`,
    },
  };
}

function shotRequestOf(options: {
  request: GenerateAssetInput;
  shot: Shot;
}): GenerateAssetInput {
  const { request, shot } = options;
  const castIds = [
    ...new Set([shot.placeId, ...shot.castIds, ...(request.cast_ids ?? [])]),
  ];
  const cameraMove =
    request.capability === "video"
      ? (request.camera_move ?? shot.camera.move)
      : request.camera_move;
  return {
    ...request,
    cast_ids: castIds,
    ...(cameraMove === undefined ? {} : { camera_move: cameraMove }),
  };
}

function startsFromPlan(options: { plan: StoryPlan; index: number }): boolean {
  const { plan, index } = options;
  const shot = plan.shots[index];
  const before = plan.shots[index - 1];
  if (shot === undefined || before === undefined) return false;
  return (
    calibrationShotIdsOf(plan).includes(shot.id) ||
    refusalsOf({ shot: before }).length > 0
  );
}

function withShot(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  request: GenerateAssetInput;
  shot: Shot;
  index: number;
}): RequestOutcome {
  const { snapshot, plan, request, shot, index } = options;
  if (request.capability !== "image" && request.capability !== "video") {
    return failed({
      kind: "invalid-value",
      message: `shot_id is for a picture or a video clip, not for ${request.capability}.`,
      hint: "Leave out shot_id, or use the capability image or video.",
    });
  }
  const blocked =
    calibrationFailureOf({ plan, shot }) ??
    sheetFailureOf({ snapshot, shot }) ??
    continuityFailureOf({
      snapshot,
      plan,
      index,
      request,
      startsFromPlan: startsFromPlan({ plan, index }),
    }) ??
    startGateFailureOf({ snapshot, shot, request });
  if (blocked !== undefined) return failed(blocked);
  const tried = withShotTry({ snapshot, shot, request });
  if (!tried.ok) return tried;
  return { ok: true, value: shotRequestOf({ request: tried.value, shot }) };
}

function storyRequestOf(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): RequestOutcome {
  const { snapshot, request } = options;
  const plan = snapshot.bible.storyPlan;
  const shotId = request.shot_id;
  const onlyFrame = firstFrameFailureOf(request);
  if (onlyFrame !== undefined) return failed(onlyFrame);
  if (shotId === undefined && needsShot(options)) {
    if (plan === undefined) return failed(planMissing());
    return failed({
      kind: "shot-not-named",
      message:
        "A video clip of this film needs the shot of the story plan that it shows.",
      hint: `Give shot_id, one of: ${plan.shots.map((shot) => shot.id).join(", ") || "none"}. Add a shot with set_story_plan when the clip shows a new one.`,
    });
  }
  if (shotId !== undefined && plan === undefined) return failed(planMissing());
  const found =
    shotId === undefined || plan === undefined
      ? undefined
      : shotOf({ plan, shotId });
  if (found !== undefined && !found.ok) return found;
  const isPictureOrClip =
    request.capability === "image" || request.capability === "video";
  if (plan !== undefined && isPictureOrClip) {
    const gate = planGateFailureOf({ bible: snapshot.bible, plan });
    if (gate !== undefined) return failed(gate);
  }
  if (found === undefined || plan === undefined) return withSheetTry(options);
  return withShot({ snapshot, plan, request, ...found.value });
}

export function withStory(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): RequestOutcome {
  const storied = storyRequestOf(options);
  if (!storied.ok) return storied;
  return {
    ok: true,
    value: withPromptAdditions({
      snapshot: options.snapshot,
      request: storied.value,
    }),
  };
}
