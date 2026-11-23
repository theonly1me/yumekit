import { z } from "zod";
import type { Snapshot } from "../engine/snapshot.js";
import { timelineOf } from "../timeline/timelineFacts.js";

export interface MadeFile {
  file: string;
  fileName: string;
  platformId: string | undefined;
  isSharper: boolean;
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

export interface ExportJob {
  callId: string;
  outputId: string;
  state: JobState;
}

export const exportResultSchema = z.object({
  file: z.string(),
  files: z
    .array(z.object({ file: z.string(), platform_id: z.string().optional() }))
    .optional(),
});

export const exportFailureSchema = z.object({
  message: z.string(),
  scene_id: z.string().optional(),
  frame: z.number().optional(),
});

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
