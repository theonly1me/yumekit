import { platformCatalog } from "@yumekit/project/platforms";
import type { Output, Snapshot } from "../engine/snapshot.js";
import {
  mainSceneClipsOf,
  outputLabel,
  timelineOf,
} from "../timeline/timelineFacts.js";

export function outputsHoldingClip(options: {
  snapshot: Snapshot;
  clipId: string;
  currentOutput: Output;
}): [Output, ...Output[]] {
  const { snapshot, clipId, currentOutput } = options;
  const holders = snapshot.project.outputs.filter((output) =>
    mainSceneClipsOf({
      timeline: timelineOf({ snapshot, outputId: output.id }),
      scenes: snapshot.scenes,
    }).some((clip) => clip.id === clipId),
  );
  const others = holders.filter((output) => output.id !== currentOutput.id);
  return [currentOutput, ...others];
}

export function sceneNumberOf(options: {
  snapshot: Snapshot;
  output: Output;
  clipId: string;
}): number | undefined {
  const { snapshot, output } = options;
  const index = mainSceneClipsOf({
    timeline: timelineOf({ snapshot, outputId: output.id }),
    scenes: snapshot.scenes,
  }).findIndex((clip) => clip.id === options.clipId);
  return index === -1 ? undefined : index + 1;
}

export function placeNamesOf(outputs: Output[]): string[] {
  return outputs.flatMap((output) => {
    const platforms = output.platforms ?? [];
    if (platforms.length === 0) return [outputLabel(output)];
    return platformCatalog
      .filter((platform) => platforms.includes(platform.id))
      .map((platform) => platform.name);
  });
}

export function listText(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.slice(-1).join("")}`;
}
