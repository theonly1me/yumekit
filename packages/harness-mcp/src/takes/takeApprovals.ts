import type { Edit, ProjectSnapshot, Take } from "@yumekit/project";
import { withPersonChoice } from "../storyPlan/designChoice.js";
import { shotIdOf } from "../storyPlan/shotOfAsset.js";

function approvedAssetsByShot(options: {
  snapshot: ProjectSnapshot;
  approvedIds: ReadonlySet<string>;
}): Map<string, string[]> {
  const byShot = new Map<string, string[]>();
  for (const asset of options.snapshot.assets) {
    if (!options.approvedIds.has(asset.id)) continue;
    const shotId = shotIdOf(asset);
    if (shotId === undefined) continue;
    byShot.set(shotId, [...(byShot.get(shotId) ?? []), asset.id]);
  }
  return byShot;
}

function withStoryApproval(options: {
  snapshot: ProjectSnapshot;
  isApproved: boolean;
}): ProjectSnapshot {
  const { snapshot } = options;
  const { story } = snapshot.bible;
  if (!options.isApproved || story === undefined) return snapshot;
  if (story.approval === "person-said-yes") return snapshot;
  return {
    ...snapshot,
    bible: {
      ...snapshot.bible,
      story: { ...story, approval: "person-said-yes" },
    },
  };
}

export function takeApprovalEdits(options: {
  snapshot: ProjectSnapshot;
  take: Take;
  notedIds: ReadonlySet<string>;
}): Edit[] {
  const { take, notedIds } = options;
  const approvedIds = new Set(
    take.items.filter((item) => !notedIds.has(item.id)).map((item) => item.id),
  );
  let snapshot = options.snapshot;
  const words = `Approved in take ${String(take.number)}`;
  for (const [shotId, assetIds] of approvedAssetsByShot({
    snapshot,
    approvedIds,
  })) {
    snapshot = withPersonChoice({ snapshot, shotId, assetIds, words }).snapshot;
  }
  snapshot = withStoryApproval({
    snapshot,
    isApproved: take.items.some(
      (item) => item.kind === "story" && approvedIds.has(item.id),
    ),
  });
  return snapshot.bible === options.snapshot.bible
    ? []
    : [{ kind: "setBible", bible: snapshot.bible }];
}
