import { bytesInMegabyte } from "@yumekit/project/file-size";
import { findPlatform } from "@yumekit/project/platforms";
import { megabytesText } from "../fileSize/fileSizeChoice.js";
import type { EntryJob, ExportEntry } from "./exportEntry.js";
import type { ProgressByCall } from "./useExportProgress.js";

export type RevealPlace = "finder" | "file-explorer" | "folder";

const revealLabels: Record<RevealPlace, string> = {
  finder: "Show in Finder",
  "file-explorer": "Show in File Explorer",
  folder: "Open the folder",
};

export function revealPlaceOf(userAgent: string): RevealPlace {
  if (/Macintosh|Mac OS X/.test(userAgent)) return "finder";
  if (userAgent.includes("Windows")) return "file-explorer";
  return "folder";
}

export function revealLabelOf(place: RevealPlace): string {
  return revealLabels[place];
}

function joined(words: string[]): string {
  const last = words.at(-1);
  if (words.length < 2 || last === undefined) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${last}`;
}

export function jobNameOf(job: Pick<EntryJob, "outputId" | "platformIds">) {
  const names = job.platformIds.map(
    (platformId) => findPlatform(platformId)?.name ?? platformId,
  );
  if (names.length === 0) return `the ${job.outputId} file`;
  return `the ${joined(names)} ${names.length === 1 ? "file" : "files"}`;
}

export function percentOf(options: {
  job: EntryJob;
  progress: ProgressByCall;
}): number {
  if (options.job.state === "done") return 100;
  const frames = options.progress.get(options.job.callId);
  if (frames?.total === undefined || frames.total === 0) return 0;
  return Math.min(99, Math.floor((frames.done / frames.total) * 100));
}

export function runningLineOf(options: {
  entry: ExportEntry;
  progress: ProgressByCall;
}): string {
  const { entry } = options;
  const index = entry.jobs.findIndex((job) => job.state === "exporting");
  const job =
    entry.jobs[index] ?? entry.jobs.find((each) => each.state === "waiting");
  if (job === undefined) return "Exporting the film.";
  const count =
    entry.jobs.length > 1
      ? ` (${String(Math.max(index, 0) + 1)} of ${String(entry.jobs.length)})`
      : "";
  return `Exporting ${jobNameOf(job)}, ${String(percentOf({ job, progress: options.progress }))}%${count}`;
}

export function sizeTextOf(bytes: number): string {
  return megabytesText(bytes / bytesInMegabyte);
}
