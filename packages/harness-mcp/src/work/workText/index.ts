import type { ProjectSnapshot } from "@yumekit/project";
import { assetsText } from "./assetsText.js";
import { sceneText, sharedCodeText } from "./codeText.js";
import { storyText } from "./storyText.js";
import { timelinesText } from "./timelinesText.js";

export const workParts = [
  "all",
  "story",
  "code",
  "timelines",
  "assets",
] as const;

export type WorkPart = (typeof workParts)[number];

export const workCharacterLimit = 60_000;

export interface WorkText {
  text: string;
  leftOut: string[];
}

function headerOf(snapshot: ProjectSnapshot): string {
  return `# The work of "${snapshot.project.name}" at revision ${String(snapshot.revision)}`;
}

function joined(parts: string[]): string {
  return parts.join("\n\n");
}

function sum(numbers: number[]): number {
  let total = 0;
  for (const value of numbers) total += value;
  return total;
}

function scenesWithin(options: {
  snapshot: ProjectSnapshot;
  sceneIds: readonly string[] | undefined;
  budget: number;
}): WorkText {
  const { snapshot, sceneIds } = options;
  const shapes = snapshot.scenes
    .filter((scene) => sceneIds === undefined || sceneIds.includes(scene.id))
    .map((scene) => {
      const code = snapshot.sceneCode[scene.id];
      return {
        id: scene.id,
        full: sceneText({ scene, code, detail: "code" }),
        outline: sceneText({ scene, code, detail: "outline" }),
      };
    });
  let left =
    options.budget - sum(shapes.map((shape) => shape.outline.length + 1));
  const leftOut: string[] = [];
  const blocks = shapes.map((shape) => {
    const extra = shape.full.length - shape.outline.length;
    if (extra <= left) {
      left -= extra;
      return shape.full;
    }
    leftOut.push(shape.id);
    return shape.outline;
  });
  const shown = blocks.length === 0 ? ["None yet."] : blocks;
  return { text: ["## Scenes", ...shown].join("\n"), leftOut };
}

function leftOutLine(leftOut: string[]): string[] {
  return leftOut.length === 0
    ? []
    : [
        `The code of these scenes is left out for the size limit of ${String(workCharacterLimit)} characters: ${leftOut.join(", ")}. Call get_work with part "code" and scene_ids ${JSON.stringify(leftOut)}.`,
      ];
}

const noteRoom = 600;

function withScenes(options: {
  snapshot: ProjectSnapshot;
  sceneIds: readonly string[] | undefined;
  before: string[];
  after: string[];
}): WorkText {
  const fixed = joined([...options.before, ...options.after]).length;
  const scenes = scenesWithin({
    ...options,
    budget: workCharacterLimit - fixed - noteRoom,
  });
  return {
    text: joined([
      ...options.before,
      scenes.text,
      ...options.after,
      ...leftOutLine(scenes.leftOut),
    ]),
    leftOut: scenes.leftOut,
  };
}

function codeText(options: {
  snapshot: ProjectSnapshot;
  sceneIds: readonly string[] | undefined;
}): WorkText {
  const { snapshot } = options;
  return withScenes({
    ...options,
    before: [headerOf(snapshot), sharedCodeText({ snapshot, detail: "code" })],
    after: [],
  });
}

function allText(snapshot: ProjectSnapshot): WorkText {
  return withScenes({
    snapshot,
    sceneIds: undefined,
    before: [
      headerOf(snapshot),
      storyText(snapshot),
      sharedCodeText({ snapshot, detail: "code" }),
    ],
    after: [timelinesText(snapshot), assetsText(snapshot)],
  });
}

export function workTextOf(options: {
  snapshot: ProjectSnapshot;
  part: WorkPart;
  sceneIds: readonly string[] | undefined;
}): WorkText {
  const { snapshot, part } = options;
  const only = (text: string): WorkText => ({
    text: joined([headerOf(snapshot), text]),
    leftOut: [],
  });
  switch (part) {
    case "all":
      return allText(snapshot);
    case "story":
      return only(storyText(snapshot));
    case "code":
      return codeText({ snapshot, sceneIds: options.sceneIds });
    case "timelines":
      return only(timelinesText(snapshot));
    case "assets":
      return only(assetsText(snapshot));
  }
}
