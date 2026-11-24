import {
  videoStyleOf,
  type ProjectSnapshot,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { continuityFailureOf } from "./continuity.js";
import { sheetFailureOf } from "./sheets.js";

type RequestOutcome = Outcome<GenerateAssetInput, HarnessFailure>;

function failed(failure: HarnessFailure): RequestOutcome {
  return { ok: false, failure };
}

function withArtDirection(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): GenerateAssetInput {
  const { request } = options;
  const style = options.snapshot.bible.style.trim();
  const prompt = request.input["prompt"];
  const isPictureOrClip =
    request.capability === "image" || request.capability === "video";
  if (!isPictureOrClip || style === "" || typeof prompt !== "string") {
    return request;
  }
  const sentence = /[.!?]$/.test(style) ? style : `${style}.`;
  return {
    ...request,
    input: {
      ...request.input,
      prompt: `${prompt}\n\nArt direction: ${sentence}`,
    },
  };
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

export function withStory(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): RequestOutcome {
  const { snapshot } = options;
  const request = withArtDirection(options);
  const shotId = request.shot_id;
  if (shotId === undefined) {
    if (!needsShot({ snapshot, request })) return { ok: true, value: request };
    const plan = snapshot.bible.storyPlan;
    if (plan === undefined) return failed(planMissing());
    return failed({
      kind: "shot-not-named",
      message:
        "A video clip of this film needs the shot of the story plan that it shows.",
      hint: `Give shot_id, one of: ${plan.shots.map((shot) => shot.id).join(", ") || "none"}. Add a shot with set_story_plan when the clip shows a new one.`,
    });
  }
  if (request.capability !== "image" && request.capability !== "video") {
    return failed({
      kind: "invalid-value",
      message: `shot_id is for a picture or a video clip, not for ${request.capability}.`,
      hint: "Leave out shot_id, or use the capability image or video.",
    });
  }
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) return failed(planMissing());
  const found = shotOf({ plan, shotId });
  if (!found.ok) return found;
  const sheetFailure = sheetFailureOf({ snapshot, shot: found.value.shot });
  if (sheetFailure !== undefined) return failed(sheetFailure);
  const continuityFailure = continuityFailureOf({
    snapshot,
    plan,
    index: found.value.index,
    request,
  });
  if (continuityFailure !== undefined) return failed(continuityFailure);
  return {
    ok: true,
    value: shotRequestOf({ request, shot: found.value.shot }),
  };
}
