import type { ProjectState } from "../format/state.js";
import {
  sceneCodeFile,
  timelineFile,
  type RuleFailure,
} from "./ruleFailure.js";

function checkTimelinesMatchOutputs(
  state: ProjectState,
): RuleFailure | undefined {
  const outputIds = state.project.outputs.map((output) => output.id);
  const timelineIds = state.timelines.map((timeline) => timeline.outputId);
  const outputWithoutTimeline = outputIds.find(
    (id) => !timelineIds.includes(id),
  );
  if (outputWithoutTimeline !== undefined) {
    return {
      kind: "not-found",
      message: `The output "${outputWithoutTimeline}" has no timeline.`,
      file: timelineFile(outputWithoutTimeline),
    };
  }
  const timelineWithoutOutput = timelineIds.find(
    (id) => !outputIds.includes(id),
  );
  if (timelineWithoutOutput !== undefined) {
    return {
      kind: "not-found",
      message: `The timeline "${timelineWithoutOutput}" has no output.`,
      file: timelineFile(timelineWithoutOutput),
    };
  }
  return undefined;
}

function checkCastReferences(state: ProjectState): RuleFailure | undefined {
  const assetIds = new Set(state.assets.map((asset) => asset.id));
  for (const member of state.bible.cast) {
    const missing = member.referenceAssetIds.find((id) => !assetIds.has(id));
    if (missing !== undefined) {
      return {
        kind: "not-found",
        message: `The cast member "${member.id}" references the asset "${missing}", which does not exist.`,
        file: "bible.json",
      };
    }
  }
  return undefined;
}

function checkModuleSceneCode(state: ProjectState): RuleFailure | undefined {
  const sceneWithoutCode = state.scenes.find(
    (scene) => scene.source.kind === "module" && !(scene.id in state.sceneCode),
  );
  if (sceneWithoutCode === undefined) {
    return undefined;
  }
  return {
    kind: "invalid-value",
    message: `The module scene "${sceneWithoutCode.id}" has no scene.tsx file.`,
    file: sceneCodeFile(sceneWithoutCode.id),
  };
}

function checkFontReferences(state: ProjectState): RuleFailure | undefined {
  for (const font of state.project.fonts ?? []) {
    const asset = state.assets.find(
      (candidate) => candidate.id === font.assetId,
    );
    if (asset?.kind !== "font") {
      return {
        kind: asset === undefined ? "not-found" : "invalid-value",
        message:
          asset === undefined
            ? `The font "${font.family}" names the asset "${font.assetId}", which does not exist.`
            : `The font "${font.family}" names the asset "${font.assetId}", which is a ${asset.kind}, not a font.`,
        file: "project.json",
      };
    }
  }
  return undefined;
}

export function checkReferences(state: ProjectState): RuleFailure | undefined {
  return (
    checkTimelinesMatchOutputs(state) ??
    checkCastReferences(state) ??
    checkFontReferences(state) ??
    checkModuleSceneCode(state)
  );
}
