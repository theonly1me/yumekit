import {
  assetDecisionsOf,
  type Asset,
  type ProjectSnapshot,
} from "@yumekit/project";
import type { HarnessFailure } from "../results.js";
import {
  isOpen,
  shotNeedsDesign,
  standingCheckOf,
} from "../storyPlan/designGate.js";
import { shotOfAsset } from "../storyPlan/shotOfAsset.js";

function verdictFailureOf(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
}): HarnessFailure | undefined {
  const { asset } = options;
  const decision = assetDecisionsOf(options.snapshot.takes).get(asset.id);
  if (
    decision === undefined ||
    decision.verdict === "approved" ||
    decision.verdict === "question"
  ) {
    return undefined;
  }
  const take = `take ${String(decision.take.number)}`;
  return {
    kind: "picture-not-approved",
    message:
      decision.verdict === "dropped"
        ? `The person dropped "${asset.id}" in ${take}, so the film does not show it.`
        : `The person asked for a change of "${asset.id}" in ${take}, so the film does not show it.`,
    hint: "Use another picture, or make this one again in a new take of pictures.",
  };
}

export function pictureGateFailureOf(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
}): HarnessFailure | undefined {
  const { snapshot, asset } = options;
  const refused = verdictFailureOf(options);
  if (refused !== undefined) return refused;
  const shot = shotOfAsset({ snapshot, asset });
  if (shot === undefined || !shotNeedsDesign({ snapshot, shot })) {
    return undefined;
  }
  const check = standingCheckOf({ snapshot, shot, assetId: asset.id });
  if (check === undefined) {
    return {
      kind: "design-not-checked",
      message: `The design of the picture "${asset.id}" of shot "${shot.id}" has no check yet, so the film cannot show it.`,
      hint: `Call check_design for "${asset.id}", or give it to the person in a take of pictures.`,
    };
  }
  if (isOpen(check)) return undefined;
  return {
    kind: "design-break-in-range",
    message: `The design of the picture "${asset.id}" breaks (${check.breaks.join("; ")}), so the film cannot show it.`,
    hint: "Make the picture again from the sheets of the cast, with a prompt that names what must not change.",
  };
}
