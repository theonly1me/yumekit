import { join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ClipReview, Edit } from "@yumekit/project";
import { measureClipMotion, type ClipMotion } from "@yumekit/render";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { renderFailureOf } from "../output/renderFailures.js";
import { failureResult } from "../results.js";
import { endPictureEditOf } from "./endPicture.js";
import { measuresOf, planWithReview } from "./reviewRecord.js";
import { checkListOf, measuresTextOf } from "./reviewChecks.js";
import { isPassed, notShownFailureOf } from "./reviewOrder.js";
import {
  reviewClipInput,
  reviewTargetOf,
  verdictFailureOf,
  type ReviewClipInput,
  type ReviewTarget,
} from "./reviewClipInput.js";

async function showClip(options: {
  context: HarnessContext;
  input: ReviewClipInput;
  target: ReviewTarget;
  motion: ClipMotion;
}): Promise<CallToolResult> {
  const { context, target, motion } = options;
  const sheet = await context.pictures.renderAssetSheet({
    file: join(context.store.folder, target.clip.file),
    title: `${target.clip.id} for shot ${target.shot.id}: ${String(Math.round(target.lengthSeconds * 100) / 100)}s`,
    kind: "video",
    widthPixels: target.clip.widthPixels ?? 1,
    heightPixels: target.clip.heightPixels ?? 1,
    marks: target.clip.marks ?? [],
    count: options.input.count ?? 12,
  });
  if (!sheet.ok) return failureResult(renderFailureOf(sheet.failure));
  const checks = checkListOf({
    shot: target.shot,
    cast: context.store.read().bible.cast,
  });
  return {
    content: [
      {
        type: "text",
        text: `Frames at ${sheet.value.seconds.map((seconds) => `${String(seconds)}s`).join(", ")}, left to right and top to bottom.\n${measuresTextOf(motion)}`,
      },
      {
        type: "image",
        data: Buffer.from(sheet.value.picture).toString("base64"),
        mimeType: "image/jpeg",
      },
      { type: "text", text: checks },
    ],
    structuredContent: {
      asset_id: target.clip.id,
      shot_id: target.shot.id,
      seconds: sheet.value.seconds,
      measures: { ...measuresOf(motion), regions: motion.regions },
      warnings: motion.warnings,
    },
  };
}

async function storeVerdict(options: {
  context: HarnessContext;
  input: ReviewClipInput & { verdict: ClipReview["verdict"] };
  target: ReviewTarget;
  motion: ClipMotion;
}): Promise<CallToolResult> {
  const { context, input, target } = options;
  const snapshot = context.store.read();
  const isKept = input.verdict !== "redo";
  const ending = isKept
    ? await endPictureEditOf({
        snapshot,
        projectFolder: context.store.folder,
        clip: target.clip,
        seconds: input.verdict === "cut" ? input.keep_to_seconds : undefined,
      })
    : undefined;
  if (ending !== undefined && !ending.ok) return failureResult(ending.failure);
  const review: ClipReview = {
    assetId: target.clip.id,
    verdict: input.verdict,
    faults: input.faults ?? [],
    ...(input.verdict === "cut" && input.keep_from_seconds !== undefined
      ? { keepFromSeconds: input.keep_from_seconds }
      : {}),
    ...(input.verdict === "cut" && input.keep_to_seconds !== undefined
      ? { keepToSeconds: input.keep_to_seconds }
      : {}),
    ...(ending === undefined
      ? {}
      : { endPictureAssetId: ending.value.assetId }),
    measures: measuresOf(options.motion),
  };
  const { bible } = snapshot;
  const plan = bible.storyPlan;
  if (plan === undefined) throw new Error("A review target needs a plan.");
  const edits: Edit[] = [
    ...(ending === undefined ? [] : [ending.value.edit]),
    {
      kind: "setBible",
      bible: {
        ...bible,
        storyPlan: planWithReview({ plan, shotId: target.shot.id, review }),
      },
    },
  ];
  const endLine =
    ending === undefined
      ? "Make it again with a prompt that names each fault."
      : `The end picture "${ending.value.assetId}" is the start of the next shot in the same place.`;
  return applyEditsResult({
    store: context.store,
    edits,
    line: `Review of "${target.clip.id}" for shot "${target.shot.id}": ${input.verdict}. ${endLine}`,
    data: {
      verdict: input.verdict,
      ...(ending === undefined
        ? {}
        : { end_picture_asset_id: ending.value.assetId }),
      measures: review.measures,
    },
  });
}

export function registerReviewClip(context: HarnessContext): void {
  const shownClips = new Set<string>();
  context.tools.add({
    name: "review_clip",
    description:
      "Review a video clip of a shot before you place it. Without verdict it shows the frames, measures the motion (how much moves, by part of the picture, the camera, a hard jump, a part that changes suddenly, and the first frame against the start picture), and gives the fixed check list with the action and the end state of the shot. Look at each point, and look closer at each hand and face with preview_assets and a region. Then call it again with verdict keep, cut (with the good part), or redo (with the faults). keep and cut need the look first, in this session. keep and cut save the picture at the end of the good part for the next shot in the same place. place_video refuses a clip of a shot with no keep or cut.",
    inputSchema: reviewClipInput,
    run: async ({ input }) => {
      const target = reviewTargetOf({
        snapshot: context.store.read(),
        projectFolder: context.store.folder,
        input,
      });
      if (!target.ok) return failureResult(target.failure);
      const verdictFailure = verdictFailureOf({
        input,
        lengthSeconds: target.value.lengthSeconds,
      });
      if (verdictFailure !== undefined) return failureResult(verdictFailure);
      const shownKey = `${input.asset_id}/${input.shot_id}`;
      if (isPassed(input.verdict) && !shownClips.has(shownKey)) {
        return failureResult(notShownFailureOf(input));
      }
      const motion = await measureClipMotion({
        file: join(context.store.folder, target.value.clip.file),
        ...(target.value.startPicture === undefined
          ? {}
          : { startPicture: target.value.startPicture }),
      });
      if (!motion.ok) return failureResult(renderFailureOf(motion.failure));
      const { verdict } = input;
      if (verdict === undefined) shownClips.add(shownKey);
      return verdict === undefined
        ? showClip({
            context,
            input,
            target: target.value,
            motion: motion.value,
          })
        : storeVerdict({
            context,
            input: { ...input, verdict },
            target: target.value,
            motion: motion.value,
          });
    },
  });
}
