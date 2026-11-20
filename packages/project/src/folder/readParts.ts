import {
  wordsFileOfAsset,
  wordTimingsSchema,
  type WordTimings,
} from "../format/asset.js";
import { sceneSchema, type Scene } from "../format/scene.js";
import type { ProjectState } from "../format/state.js";
import { timelineSchema, type Timeline } from "../format/timeline.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { sceneCodeFile, timelineFile } from "../rules/ruleFailure.js";
import { sceneFile } from "./projectFiles.js";
import {
  readJsonFile,
  readTextFile,
  type FileSource,
  type InvalidFile,
} from "./readJsonFile.js";

export async function readScenes(
  source: FileSource,
): Promise<
  Outcome<
    { scenes: Scene[]; sceneCode: ProjectState["sceneCode"] },
    InvalidFile
  >
> {
  const scenes: Scene[] = [];
  const sceneCode: ProjectState["sceneCode"] = {};
  for (const sceneId of await source.sceneIds()) {
    const file = sceneFile(sceneId);
    const scene = await readJsonFile({ source, file, schema: sceneSchema });
    if (!scene.ok) {
      return scene;
    }
    if (scene.value.id !== sceneId) {
      return fail({
        kind: "invalid-file",
        file,
        message: `The id "${scene.value.id}" does not match the folder "${sceneId}".`,
      });
    }
    scenes.push(scene.value);
    if (scene.value.source.kind === "module") {
      const code = await readTextFile({ source, file: sceneCodeFile(sceneId) });
      if (!code.ok) {
        return code;
      }
      sceneCode[sceneId] = code.value;
    }
  }
  return succeed({ scenes, sceneCode });
}

export async function readTimelines(options: {
  source: FileSource;
  outputIds: string[];
}): Promise<Outcome<Timeline[], InvalidFile>> {
  const timelines: Timeline[] = [];
  for (const outputId of options.outputIds) {
    const file = timelineFile(outputId);
    const timeline = await readJsonFile({
      source: options.source,
      file,
      schema: timelineSchema,
    });
    if (!timeline.ok) {
      return timeline;
    }
    if (timeline.value.outputId !== outputId) {
      return fail({
        kind: "invalid-file",
        file,
        message: `The outputId "${timeline.value.outputId}" does not match the file name.`,
      });
    }
    timelines.push(timeline.value);
  }
  return succeed(timelines);
}

export async function readWords(options: {
  source: FileSource;
  assetIds: string[];
}): Promise<Outcome<ProjectState["words"], InvalidFile>> {
  const words: Record<string, WordTimings> = {};
  for (const assetId of options.assetIds) {
    const timings = await readJsonFile({
      source: options.source,
      file: wordsFileOfAsset(assetId),
      schema: wordTimingsSchema,
    });
    if (!timings.ok) {
      return timings;
    }
    words[assetId] = timings.value;
  }
  return succeed(words);
}
