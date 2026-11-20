import type { ProjectState } from "../format/state.js";
import { checkAssetDurations } from "./assetDurations.js";
import { checkClips } from "./clips.js";
import { checkReferences } from "./references.js";
import type { RuleFailure } from "./ruleFailure.js";
import { checkUniqueIds } from "./uniqueIds.js";

export type { RuleFailure } from "./ruleFailure.js";

export function checkRules(state: ProjectState): RuleFailure | undefined {
  return (
    checkUniqueIds(state) ??
    checkReferences(state) ??
    checkAssetDurations(state) ??
    checkClips(state)
  );
}
