import { type Asset, type ProjectSnapshot, type Shot } from "@yumekit/project";
import type { z } from "zod";
import { idInput } from "../inputs.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { previousEndOf } from "./continuity.js";

export const reviewClipInput = {
  asset_id: idInput("The video clip to review."),
  shot_id: idInput("The shot of the story plan that the clip shows."),
};

export type ReviewClipInput = z.infer<z.ZodObject<typeof reviewClipInput>>;

export interface ReviewTarget {
  shot: Shot;
  clip: Asset;
  startPicture: Asset | undefined;
  previousEnd: Asset | undefined;
  lengthSeconds: number;
}

function failed(
  failure: HarnessFailure,
): Outcome<ReviewTarget, HarnessFailure> {
  return { ok: false, failure };
}

export function reviewTargetOf(options: {
  snapshot: ProjectSnapshot;
  input: ReviewClipInput;
}): Outcome<ReviewTarget, HarnessFailure> {
  const { snapshot, input } = options;
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) {
    return failed({
      kind: "story-plan-missing",
      message: "This project has no story plan.",
      hint: "Write it with set_story_plan first.",
    });
  }
  const shotIndex = plan.shots.findIndex(
    (candidate) => candidate.id === input.shot_id,
  );
  const shot = plan.shots[shotIndex];
  if (shot === undefined) {
    return failed({
      kind: "shot-not-found",
      message: `The story plan has no shot "${input.shot_id}".`,
      hint: `Use one of these shot ids: ${plan.shots.map((candidate) => candidate.id).join(", ")}.`,
    });
  }
  const clip = snapshot.assets.find(
    (candidate) =>
      candidate.id === input.asset_id && candidate.kind === "video",
  );
  if (clip === undefined) {
    const videoIds = snapshot.assets
      .filter((candidate) => candidate.kind === "video")
      .map((candidate) => candidate.id);
    return failed({
      kind: "asset-not-found",
      message: `The project has no video clip "${input.asset_id}".`,
      hint: `Use one of these video ids: ${videoIds.join(", ") || "none"}.`,
    });
  }
  const startId =
    clip.source.kind === "tool"
      ? clip.source.input["first_frame_asset_id"]
      : undefined;
  const start = snapshot.assets.find(
    (candidate) => candidate.id === startId && candidate.kind === "image",
  );
  return {
    ok: true,
    value: {
      shot,
      clip,
      startPicture: start,
      previousEnd: previousEndOf({ snapshot, plan, shotIndex }),
      lengthSeconds:
        (clip.durationFrames ?? 0) / snapshot.project.framesPerSecond,
    },
  };
}
