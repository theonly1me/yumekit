import {
  isRefusedByPerson,
  type Asset,
  type Edit,
  type ProjectSnapshot,
} from "@yumekit/project";
import { z } from "zod";
import { shotIdOf } from "./shotOfAsset.js";

export const personChoseThisClipInput = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .optional()
  .describe(
    "The words of the person that choose this clip, as the person wrote them, for example 'Use the second bridge clip'. Give it only when the person chose this clip, in a request or in a message while you work. The choice of the person passes the design check of the clip and overrides a redo verdict of the critic: the clip is stored as kept by the person, with the faults of the critic, and it is placed.",
  );

export function withPersonKept(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  words: string | undefined;
}): { snapshot: ProjectSnapshot; edits: Edit[] } {
  const { snapshot, asset, words } = options;
  const unchanged = { snapshot, edits: [] };
  const plan = snapshot.bible.storyPlan;
  const shotId = shotIdOf(asset);
  if (words === undefined || plan === undefined || shotId === undefined) {
    return unchanged;
  }
  if (isRefusedByPerson({ takes: snapshot.takes, assetId: asset.id })) {
    return unchanged;
  }
  const shot = plan.shots.find((candidate) => candidate.id === shotId);
  const review = (shot?.reviews ?? []).findLast(
    (candidate) => candidate.assetId === asset.id && candidate.by === "critic",
  );
  if (review?.verdict !== "redo") return unchanged;
  const bible = {
    ...snapshot.bible,
    storyPlan: {
      ...plan,
      shots: plan.shots.map((candidate) =>
        candidate.id === shotId
          ? {
              ...candidate,
              reviews: (candidate.reviews ?? []).map((existing) =>
                existing === review
                  ? { ...existing, personKept: { words } }
                  : existing,
              ),
            }
          : candidate,
      ),
    },
  };
  return {
    snapshot: { ...snapshot, bible },
    edits: [{ kind: "setBible", bible }],
  };
}
