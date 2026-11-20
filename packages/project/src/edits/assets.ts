import { join } from "node:path";
import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";
import { hashFile } from "./hashFile.js";

export async function addAsset(options: {
  state: ProjectState;
  edit: EditOfKind<"addAsset">;
  folder: string;
}): Promise<EditResult> {
  const { state, edit } = options;
  if (state.assets.some((asset) => asset.id === edit.asset.id)) {
    return problem({
      kind: "id-in-use",
      message: `The asset "${edit.asset.id}" already exists.`,
    });
  }
  const contentHash = await hashFile(join(options.folder, edit.asset.file));
  if (contentHash === undefined) {
    return problem({
      kind: "not-found",
      message: `The file "${edit.asset.file}" of the asset "${edit.asset.id}" does not exist.`,
    });
  }
  const asset = {
    ...edit.asset,
    contentHash,
    hasWords: edit.words !== undefined,
  };
  return succeed({
    ...state,
    assets: [...state.assets, asset],
    words:
      edit.words === undefined
        ? state.words
        : { ...state.words, [asset.id]: edit.words },
  });
}

export function setAssetWords(options: {
  state: ProjectState;
  edit: EditOfKind<"setAssetWords">;
}): EditResult {
  const { state, edit } = options;
  const asset = state.assets.find((candidate) => candidate.id === edit.assetId);
  if (asset === undefined) {
    return problem({
      kind: "not-found",
      message: `The asset "${edit.assetId}" does not exist.`,
    });
  }
  if (asset.kind !== "audio") {
    return problem({
      kind: "invalid-value",
      message: `The asset "${asset.id}" is of kind ${asset.kind}. Only an audio asset has word timings.`,
    });
  }
  return succeed({
    ...state,
    assets: state.assets.map((candidate) =>
      candidate === asset ? { ...asset, hasWords: true } : candidate,
    ),
    words: { ...state.words, [asset.id]: edit.words },
  });
}

function referencesToAsset(options: {
  state: ProjectState;
  assetId: string;
}): string[] {
  const { state, assetId } = options;
  const clipReferences = state.timelines.flatMap((timeline) =>
    timeline.tracks.flatMap((track) =>
      track.kind === "audio"
        ? track.clips
            .filter((clip) => clip.assetId === assetId)
            .map(
              (clip) => `clip "${clip.id}" in timeline "${timeline.outputId}"`,
            )
        : [],
    ),
  );
  const castReferences = state.bible.cast
    .filter((member) => member.referenceAssetIds.includes(assetId))
    .map((member) => `cast member "${member.id}"`);
  return [...clipReferences, ...castReferences];
}

export function removeAsset(options: {
  state: ProjectState;
  edit: EditOfKind<"removeAsset">;
}): EditResult {
  const { state, edit } = options;
  if (!state.assets.some((asset) => asset.id === edit.assetId)) {
    return problem({
      kind: "not-found",
      message: `The asset "${edit.assetId}" does not exist.`,
    });
  }
  const references = referencesToAsset({ state, assetId: edit.assetId });
  if (references.length > 0) {
    return problem({
      kind: "still-referenced",
      message: `The asset "${edit.assetId}" is still referenced by: ${references.join(", ")}.`,
    });
  }
  return succeed({
    ...state,
    assets: state.assets.filter((asset) => asset.id !== edit.assetId),
    words: Object.fromEntries(
      Object.entries(state.words).filter(
        ([assetId]) => assetId !== edit.assetId,
      ),
    ),
  });
}
