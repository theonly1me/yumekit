import type { Output, Snapshot } from "../engine/snapshot.js";
import { platformTabsOf } from "../platforms/platformTabFacts.js";
import { soundRowsOf } from "../sound/soundRowFacts.js";
import { lengthFramesOf, timelineOf } from "../timeline/timelineFacts.js";

export interface ExportRow {
  key: string;
  name: string;
  shape: string;
  output: Output;
  platformId: string | undefined;
  fileName: string;
  lengthFrames: number;
}

const longestFileName = 64;

export function fileNameOfProject(name: string): string {
  const safe = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .slice(0, longestFileName)
    .replace(/^-+|-+$/g, "");
  return safe === "" ? "video" : safe;
}

export function exportRowsOf(snapshot: Snapshot): ExportRow[] {
  const projectFileName = fileNameOfProject(snapshot.project.name);
  return platformTabsOf(snapshot.project.outputs).map((tab) => ({
    key: tab.key,
    name: tab.name,
    shape: tab.shape,
    output: tab.output,
    platformId: tab.platformId,
    fileName: `${projectFileName}-${tab.platformId ?? tab.output.id}.mp4`,
    lengthFrames: lengthFramesOf(
      timelineOf({ snapshot, outputId: tab.output.id }),
    ),
  }));
}

export function outputIdsOf(rows: ExportRow[]): string[] {
  return [...new Set(rows.map((row) => row.output.id))];
}

export function videosWord(count: number): string {
  return count === 1 ? "1 video" : `${String(count)} videos`;
}

function listText(words: string[]): string {
  const last = words.at(-1);
  if (words.length < 2 || last === undefined) return words.join("");
  const others = words.slice(0, -1).join(", ");
  return `${others}${words.length > 2 ? "," : ""} and ${last}`;
}

export function leadOf(options: { snapshot: Snapshot; rows: ExportRow[] }) {
  const { snapshot, rows } = options;
  const longest = Math.max(0, ...rows.map((row) => row.lengthFrames));
  const seconds = Math.round(longest / snapshot.project.framesPerSecond);
  const [first] = rows;
  const sounds =
    first === undefined
      ? []
      : soundRowsOf({
          timeline: timelineOf({ snapshot, outputId: first.output.id }),
          scenes: snapshot.scenes,
          assets: snapshot.assets,
        }).map((row) => row.name.replace(/ \d+$/, "").toLowerCase());
  const unique = [...new Set(sounds)];
  const length = `${String(seconds)} ${seconds === 1 ? "second" : "seconds"}`;
  return unique.length === 0
    ? `${length}.`
    : `${length}, with ${listText(unique)}.`;
}
