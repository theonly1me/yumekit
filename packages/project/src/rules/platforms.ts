import type { ProjectState } from "../format/state.js";
import { platformOf } from "../platforms/catalog.js";
import type { RuleFailure } from "./ruleFailure.js";

export function checkPlatforms(state: ProjectState): RuleFailure | undefined {
  const seen = new Map<string, string>();
  for (const output of state.project.outputs) {
    for (const platformId of output.platforms ?? []) {
      const platform = platformOf(platformId);
      const holder = seen.get(platformId);
      if (holder !== undefined) {
        return {
          kind: "id-in-use",
          message: `The platform "${platformId}" is on the outputs "${holder}" and "${output.id}". A platform is on one output only.`,
          file: "project.json",
        };
      }
      seen.set(platformId, output.id);
      if (
        platform.widthPixels !== output.widthPixels ||
        platform.heightPixels !== output.heightPixels
      ) {
        return {
          kind: "invalid-value",
          message: `The platform "${platformId}" is ${String(platform.widthPixels)} by ${String(platform.heightPixels)}, but the output "${output.id}" is ${String(output.widthPixels)} by ${String(output.heightPixels)}.`,
          file: "project.json",
        };
      }
    }
  }
  return undefined;
}
