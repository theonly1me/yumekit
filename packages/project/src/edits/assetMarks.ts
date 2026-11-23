import type { Asset } from "../format/asset.js";
import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

const markableKinds: readonly string[] = ["image", "video"];

function withoutMarks(asset: Asset): Asset {
  const copy: Asset = { ...asset };
  delete copy.marks;
  return copy;
}

export function setAssetMarks(options: {
  state: ProjectState;
  edit: EditOfKind<"setAssetMarks">;
}): EditResult {
  const { state, edit } = options;
  const asset = state.assets.find((candidate) => candidate.id === edit.assetId);
  if (asset === undefined) {
    return problem({
      kind: "not-found",
      message: `The asset "${edit.assetId}" does not exist.`,
    });
  }
  if (!markableKinds.includes(asset.kind)) {
    return problem({
      kind: "invalid-value",
      message: `The asset "${asset.id}" is of kind ${asset.kind}. Only an image or a video asset has marks.`,
    });
  }
  const marked =
    edit.marks.length === 0
      ? withoutMarks(asset)
      : { ...asset, marks: edit.marks };
  return succeed({
    ...state,
    assets: state.assets.map((candidate) =>
      candidate === asset ? marked : candidate,
    ),
  });
}
