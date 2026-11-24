import type { Asset, ProjectSnapshot } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

function shotIdOf(asset: Asset): string | undefined {
  if (asset.source.kind !== "tool") return undefined;
  const shotId = asset.source.input["shot_id"];
  return typeof shotId === "string" ? shotId : undefined;
}

export function reviewGateFailureOf(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
}): HarnessFailure | undefined {
  const { asset } = options;
  const shotId = shotIdOf(asset);
  if (shotId === undefined) return undefined;
  const shot = options.snapshot.bible.storyPlan?.shots.find(
    (candidate) => candidate.id === shotId,
  );
  if (shot === undefined) return undefined;
  const review = (shot.reviews ?? []).findLast(
    (candidate) => candidate.assetId === asset.id,
  );
  if (review === undefined) {
    return {
      kind: "clip-not-reviewed",
      message: `The clip "${asset.id}" of shot "${shotId}" has no review yet.`,
      hint: `Call review_clip with asset_id "${asset.id}" and shot_id "${shotId}", look at the frames and the check list, and give a verdict. Then place it.`,
    };
  }
  if (review.verdict !== "redo") return undefined;
  return {
    kind: "clip-failed-review",
    message: `The review of "${asset.id}" says redo: ${review.faults.join("; ")}.`,
    hint: "Make the clip again with a prompt that names each fault, review it, and place the new clip.",
  };
}
