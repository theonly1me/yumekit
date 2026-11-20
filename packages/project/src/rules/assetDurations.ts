import type { ProjectState } from "../format/state.js";
import type { RuleFailure } from "./ruleFailure.js";

export function checkAssetDurations(
  state: ProjectState,
): RuleFailure | undefined {
  const assetWithoutDuration = state.assets.find(
    (asset) =>
      (asset.kind === "audio" || asset.kind === "video") &&
      asset.durationFrames === undefined,
  );
  if (assetWithoutDuration === undefined) {
    return undefined;
  }
  return {
    kind: "invalid-value",
    message: `The ${assetWithoutDuration.kind} asset "${assetWithoutDuration.id}" has no durationFrames.`,
    file: "assets/index.json",
  };
}
