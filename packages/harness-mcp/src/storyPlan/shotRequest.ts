import {
  videoStyleOf,
  type ProjectSnapshot,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { briefFaultFailureOf } from "./briefFaultGate.js";
import { continuityFailureOf } from "./continuity.js";
import { keyPictureFailureOf } from "./designGate.js";
import { firstFrameFailureOf } from "./firstFrameRule.js";
import { withPlannedPrompt } from "./promptPlan.js";
import { withSheetRequest } from "./sheetRequest.js";
import { sheetFailureOf } from "./sheets.js";
import { sourceTextOf } from "./tryRules.js";

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
}): Outcome<Shot, HarnessFailure> {
  const shot = options.plan.shots.find(
    (candidate) => candidate.id === options.shotId,
  );
  if (shot !== undefined) return { ok: true, value: shot };
  return {
    ok: false,
    failure: {
      kind: "shot-not-found",
      message: `The story plan has no shot "${options.shotId}".`,
      hint: `Use one of these shot ids: ${options.plan.shots.map((candidate) => candidate.id).join(", ")}. Or add the shot with set_story_plan.`,
    },
  };
}

function plannedShotRequest(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
  shot: Shot;
}): GenerateAssetInput {
  const { snapshot, request, shot } = options;
  const kind = request.capability === "video" ? "video" : "image";
  const planned = kind === "video" ? shot.videoPrompt : shot.startPicturePrompt;
  const isEndPicture = kind === "image" && request.key_picture === "end";
  const prompted =
    planned === undefined || isEndPicture
      ? request
      : withPlannedPrompt({
          request,
          planned: [planned],
          made: snapshot.assets.filter(
            (asset) =>
              sourceTextOf({ asset, field: "shot_id" }) === shot.id &&
              asset.kind === kind,
          ),
        });
  return {
    ...prompted,
    cast_ids: [
      ...new Set([shot.placeId, ...shot.castIds, ...(request.cast_ids ?? [])]),
    ],
  };
}

function withShot(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  request: GenerateAssetInput;
  shot: Shot;
}): RequestOutcome {
  const { snapshot, plan, request, shot } = options;
  if (request.capability !== "image" && request.capability !== "video") {
    return failed({
      kind: "invalid-value",
      message: `shot_id is for a picture or a video clip, not for ${request.capability}.`,
      hint: "Leave out shot_id, or use the capability image or video.",
    });
  }
  const blocked =
    briefFaultFailureOf({ bible: snapshot.bible, plan, shot }) ??
    sheetFailureOf({ snapshot, shot }) ??
    continuityFailureOf({ snapshot, plan, shot, request }) ??
    keyPictureFailureOf({ snapshot, shot, request });
  if (blocked !== undefined) return failed(blocked);
  return { ok: true, value: plannedShotRequest({ snapshot, request, shot }) };
}

export function withStory(options: {
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
  if (shotId === undefined) return withSheetRequest(options);
  if (plan === undefined) return failed(planMissing());
  const found = shotOf({ plan, shotId });
  if (!found.ok) return found;
  return withShot({ snapshot, plan, request, shot: found.value });
}
