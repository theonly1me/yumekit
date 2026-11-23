import { z } from "zod";
import { assetIndexSchema } from "../format/asset.js";
import { bibleSchema } from "../format/bible.js";
import { projectSchema } from "../format/project.js";
import type { ProjectState } from "../format/state.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { checkRules } from "../rules/index.js";
import {
  readScenes,
  readSharedCode,
  readTimelines,
  readWords,
} from "./readParts.js";
import {
  parseJson,
  readJsonFile,
  readTextFile,
  type FileSource,
  type InvalidFile,
} from "./readJsonFile.js";
export type StateProblem =
  InvalidFile | { kind: "unsupported-format-version"; message: string };

const formatVersionSchema = z.object({ formatVersion: z.number() });

async function checkFormatVersion(
  source: FileSource,
): Promise<StateProblem | undefined> {
  const text = await readTextFile({ source, file: "project.json" });
  if (!text.ok) {
    return text.failure;
  }
  const json = parseJson({ text: text.value, file: "project.json" });
  if (!json.ok) {
    return json.failure;
  }
  const version = formatVersionSchema.safeParse(json.value);
  if (version.success && version.data.formatVersion !== 1) {
    return {
      kind: "unsupported-format-version",
      message: `The format version ${String(version.data.formatVersion)} is not supported. This version of yumekit reads format version 1.`,
    };
  }
  return undefined;
}

export async function readState(
  source: FileSource,
): Promise<Outcome<ProjectState, StateProblem>> {
  const versionProblem = await checkFormatVersion(source);
  if (versionProblem !== undefined) {
    return fail(versionProblem);
  }
  const project = await readJsonFile({
    source,
    file: "project.json",
    schema: projectSchema,
  });
  if (!project.ok) {
    return project;
  }
  const script = await readTextFile({ source, file: "script.md" });
  if (!script.ok) {
    return script;
  }
  const bible = await readJsonFile({
    source,
    file: "bible.json",
    schema: bibleSchema,
  });
  if (!bible.ok) {
    return bible;
  }
  const assetIndex = await readJsonFile({
    source,
    file: "assets/index.json",
    schema: assetIndexSchema,
  });
  if (!assetIndex.ok) {
    return assetIndex;
  }
  const scenes = await readScenes(source);
  if (!scenes.ok) {
    return scenes;
  }
  const sharedCode = await readSharedCode(source);
  if (!sharedCode.ok) {
    return sharedCode;
  }
  const timelines = await readTimelines({
    source,
    outputIds: project.value.outputs.map((output) => output.id),
  });
  if (!timelines.ok) {
    return timelines;
  }
  const assetIds = assetIndex.value.assets
    .filter((asset) => asset.hasWords)
    .map((asset) => asset.id);
  const words = await readWords({ source, assetIds });
  if (!words.ok) {
    return words;
  }
  const state: ProjectState = {
    project: project.value,
    script: script.value,
    bible: bible.value,
    scenes: scenes.value.scenes,
    sceneCode: scenes.value.sceneCode,
    sharedCode: sharedCode.value,
    timelines: timelines.value,
    assets: assetIndex.value.assets,
    words: words.value,
  };
  const ruleFailure = checkRules(state);
  if (ruleFailure !== undefined) {
    return fail({
      kind: "invalid-file",
      file: ruleFailure.file,
      message: ruleFailure.message,
    });
  }
  return succeed(state);
}
