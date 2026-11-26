import {
  fileNameOf,
  type ExportJob,
  type JobState,
  type MadeFile,
} from "../exportJobs.js";
import {
  bestQuality,
  type FileSizeChoice,
} from "../fileSize/fileSizeChoice.js";
import type { EntryJob, ExportEntry } from "./exportEntry.js";
import type { ProgressByCall } from "./useExportProgress.js";

export type SharperState =
  | { kind: "sharpening" }
  | { kind: "done"; files: MadeFile[]; failure: string | undefined };

export type SharperByOutput = ReadonlyMap<string, SharperState>;

export function madeFilesOf(job: EntryJob): MadeFile[] {
  return job.files.map((exported) => {
    const fileName = fileNameOf(exported.path);
    return {
      file: exported.path,
      fileName,
      renderPath: exported.renderPath,
      served: { folder: "exports", fileName },
      platformId: exported.platformId,
      isSharper: false,
      bytes: exported.bytes,
      shortSidePixels: job.shortSidePixels,
    };
  });
}

function fileSizeOf(entry: ExportEntry): FileSizeChoice {
  return entry.largestMegabytes === undefined
    ? bestQuality
    : {
        kind: "smaller",
        largestMegabytes: entry.largestMegabytes,
        ownText: "",
        shortSidePixels: entry.shortSidePixels,
      };
}

function stateOf(options: {
  job: EntryJob;
  progress: ProgressByCall;
  sharper: SharperState | undefined;
}): JobState {
  const { job, sharper } = options;
  switch (job.state) {
    case "waiting":
      return { kind: "waiting" };
    case "exporting": {
      const progress = options.progress.get(job.callId);
      return {
        kind: "exporting",
        framesDone: progress?.done ?? 0,
        frameCount: progress?.total,
      };
    }
    case "failed":
      return {
        kind: "failed",
        message: job.failure?.message ?? "The export did not finish.",
        failedAt:
          job.failure?.sceneId === undefined
            ? undefined
            : { sceneId: job.failure.sceneId, frame: job.failure.frame },
      };
    case "done": {
      const files = madeFilesOf(job);
      if (sharper?.kind === "sharpening") return { kind: "sharpening", files };
      return sharper === undefined
        ? { kind: "done", files, sharperFailure: undefined }
        : {
            kind: "done",
            files: sharper.files,
            sharperFailure: sharper.failure,
          };
    }
  }
}

export function jobsOfEntry(options: {
  entry: ExportEntry | undefined;
  progress: ProgressByCall;
  sharper: SharperByOutput;
}): ExportJob[] {
  const { entry } = options;
  if (entry === undefined) return [];
  return entry.jobs.map((job) => ({
    callId: job.callId,
    outputId: job.outputId,
    scale: entry.scale,
    fileSize: fileSizeOf(entry),
    state: stateOf({
      job,
      progress: options.progress,
      sharper: options.sharper.get(job.outputId),
    }),
  }));
}
