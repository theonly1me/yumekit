import { wordsFileOfAsset } from "../format/asset.js";
import type { ProjectState } from "../format/state.js";
import { sceneCodeFile, timelineFile } from "../rules/ruleFailure.js";
import { stableJson } from "./stableJson.js";

export type ProjectFiles = ReadonlyMap<string, string>;

export function sceneFile(sceneId: string): string {
  return `scenes/${sceneId}/scene.json`;
}

export function projectFilesOf(state: ProjectState): ProjectFiles {
  const files = new Map<string, string>([
    ["project.json", stableJson(state.project)],
    ["script.md", state.script],
    ["bible.json", stableJson(state.bible)],
    ["assets/index.json", stableJson({ assets: state.assets })],
  ]);
  for (const scene of state.scenes) {
    files.set(sceneFile(scene.id), stableJson(scene));
  }
  for (const [sceneId, code] of Object.entries(state.sceneCode)) {
    files.set(sceneCodeFile(sceneId), code);
  }
  for (const timeline of state.timelines) {
    files.set(timelineFile(timeline.outputId), stableJson(timeline));
  }
  for (const [assetId, words] of Object.entries(state.words)) {
    files.set(wordsFileOfAsset(assetId), stableJson(words));
  }
  return files;
}
