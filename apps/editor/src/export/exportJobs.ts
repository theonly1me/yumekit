import type { Snapshot } from "../engine/snapshot.js";
import { timelineOf } from "../timeline/timelineFacts.js";
import type { FileSizeChoice } from "./fileSize/fileSizeChoice.js";
import type { ServedFile } from "./openVideoFile.js";

export interface MadeFile {
  file: string;
  fileName: string;
  renderPath: string;
  served: ServedFile;
  platformId: string | undefined;
  isSharper: boolean;
  bytes?: number | undefined;
  shortSidePixels?: number | undefined;
}

export type JobState =
  | { kind: "waiting" }
  | { kind: "exporting"; framesDone: number; frameCount: number | undefined }
  | { kind: "sharpening"; files: MadeFile[] }
  | { kind: "done"; files: MadeFile[]; sharperFailure: string | undefined }
  | { kind: "failed"; message: string; failedAt: FailedAt | undefined };

export interface FailedAt {
  sceneId: string;
  frame: number | undefined;
}

export type SceneTarget = FailedAt & { outputId: string };

export const exportScales = [
  { scale: 1, label: "Full" },
  { scale: 0.5, label: "Half" },
  { scale: 0.25, label: "Quarter" },
] as const;

export type ExportScale = (typeof exportScales)[number]["scale"];

export interface ExportJob {
  callId: string;
  outputId: string;
  scale: ExportScale;
  fileSize: FileSizeChoice;
  state: JobState;
}

const sharpeningShare = 0.9;

export function fileNameOf(file: string): string {
  return file.split(/[\\/]/).pop() ?? file;
}

export function shareOf(state: JobState): number {
  if (state.kind === "done" || state.kind === "failed") return 1;
  if (state.kind === "waiting") return 0;
  if (state.kind === "sharpening") return sharpeningShare;
  const { framesDone, frameCount } = state;
  return frameCount === undefined || frameCount === 0
    ? 0
    : framesDone / frameCount;
}

export function exportButtonLabel(options: {
  jobs: ExportJob[];
  isRunning: boolean;
}): string {
  if (!options.isRunning) return "Export";
  const total = options.jobs.reduce(
    (...[sum, job]) => sum + shareOf(job.state),
    0,
  );
  const percent = Math.floor((total / Math.max(1, options.jobs.length)) * 100);
  return `Exporting ${String(percent)}%`;
}

export function clipOfTarget(options: {
  snapshot: Snapshot;
  target: SceneTarget;
}): { id: string; startFrame: number } | undefined {
  const { snapshot, target } = options;
  const clips = timelineOf({ snapshot, outputId: target.outputId })
    .tracks.flatMap((track) => (track.kind === "scene" ? track.clips : []))
    .filter((clip) => clip.sceneId === target.sceneId);
  const frame = target.frame;
  return (
    clips.find(
      (clip) =>
        frame !== undefined &&
        frame >= clip.startFrame &&
        frame < clip.startFrame + clip.durationFrames,
    ) ?? clips[0]
  );
}
