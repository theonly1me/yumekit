import { wordsFileOfAsset } from "../format/asset.js";
import type { ProjectState } from "../format/state.js";
import { takesFile } from "../format/takes.js";
import { sceneCodeFile, timelineFile } from "../rules/ruleFailure.js";
import { stableJson } from "./stableJson.js";

export type ProjectFiles = ReadonlyMap<string, string>;

export function sceneFile(sceneId: string): string {
  return `scenes/${sceneId}/scene.json`;
}

export const sharedFolderName = "_shared";
export const sharedFolder = `scenes/${sharedFolderName}`;

export function sharedCodeFile(name: string): string {
  return `${sharedFolder}/${name}.tsx`;
}

export function sharedCodeNameOfFile(file: string): string | undefined {
  return /^scenes\/_shared\/([a-z0-9][a-z0-9-]{0,63})\.tsx$/.exec(file)?.[1];
}

export function projectFilesOf(state: ProjectState): ProjectFiles {
  const files = new Map<string, string>([
    ["project.json", stableJson(state.project)],
    ["script.md", state.script],
    ["bible.json", stableJson(state.bible)],
    ["assets/index.json", stableJson({ assets: state.assets })],
  ]);
  if (state.takes.length > 0) {
    files.set(takesFile, stableJson({ takes: state.takes }));
  }
  for (const scene of state.scenes) {
    files.set(sceneFile(scene.id), stableJson(scene));
  }
  for (const [sceneId, code] of Object.entries(state.sceneCode)) {
    files.set(sceneCodeFile(sceneId), code);
  }
  for (const [name, code] of Object.entries(state.sharedCode)) {
    files.set(sharedCodeFile(name), code);
  }
  for (const timeline of state.timelines) {
    files.set(timelineFile(timeline.outputId), stableJson(timeline));
  }
  for (const [assetId, words] of Object.entries(state.words)) {
    files.set(wordsFileOfAsset(assetId), stableJson(words));
  }
  return files;
}
