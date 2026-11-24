import { join } from "node:path";
import {
  reviewVerdicts,
  type Asset,
  type ProjectSnapshot,
  type Shot,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";
import type { HarnessFailure, Outcome } from "../results.js";

export const reviewClipInput = {
  asset_id: idInput("The video clip to review."),
  shot_id: idInput("The shot of the story plan that the clip shows."),
  count: z
    .int()
    .min(4)
    .max(24)
    .optional()
    .describe("How many frames the sheet shows. Default 12."),
  verdict: z
    .enum(reviewVerdicts)
    .optional()
    .describe(
      "Give it only after you looked at the frames and the check list: keep (the whole clip passes), cut (only the part from keep_from_seconds to keep_to_seconds passes), or redo (make it again). Leave it out to look.",
    ),
  faults: z
    .array(z.string().trim().min(1))
    .optional()
    .describe(
      "What failed, in plain words, for example 'the door opens on its hinge side' or 'the lantern changes hands at 3.3 seconds'. Needed for cut and redo.",
    ),
  keep_from_seconds: z
    .number()
    .min(0)
    .optional()
    .describe("With cut: where the good part starts."),
  keep_to_seconds: z
    .number()
    .positive()
    .optional()
    .describe("With cut: where the good part ends."),
};

export type ReviewClipInput = z.infer<z.ZodObject<typeof reviewClipInput>>;

export interface ReviewTarget {
  shot: Shot;
  clip: Asset;
  startPicture: string | undefined;
  lengthSeconds: number;
}

function failed(
  failure: HarnessFailure,
): Outcome<ReviewTarget, HarnessFailure> {
  return { ok: false, failure };
}

export function reviewTargetOf(options: {
  snapshot: ProjectSnapshot;
  projectFolder: string;
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
  const shot = plan.shots.find((candidate) => candidate.id === input.shot_id);
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
      startPicture:
        start === undefined
          ? undefined
          : join(options.projectFolder, start.file),
      lengthSeconds:
        (clip.durationFrames ?? 0) / snapshot.project.framesPerSecond,
    },
  };
}

export function verdictFailureOf(options: {
  input: ReviewClipInput;
  lengthSeconds: number;
}): HarnessFailure | undefined {
  const { input } = options;
  if (input.verdict === undefined || input.verdict === "keep") return undefined;
  if ((input.faults ?? []).length === 0) {
    return {
      kind: "invalid-value",
      message: `A ${input.verdict} verdict needs the faults that you found.`,
      hint: "Give faults: what failed, in plain words, with the time.",
    };
  }
  if (input.verdict === "redo") return undefined;
  const from = input.keep_from_seconds;
  const to = input.keep_to_seconds;
  if (from === undefined || to === undefined || from >= to) {
    return {
      kind: "invalid-value",
      message: "A cut needs keep_from_seconds before keep_to_seconds.",
      hint: `Give the good part of the clip, inside 0 to ${String(Math.round(options.lengthSeconds * 100) / 100)} seconds.`,
    };
  }
  if (to > options.lengthSeconds + 0.05) {
    return {
      kind: "invalid-value",
      message: `keep_to_seconds ${String(to)} is after the end of the clip.`,
      hint: `The clip is ${String(Math.round(options.lengthSeconds * 100) / 100)} seconds long.`,
    };
  }
  return undefined;
}
