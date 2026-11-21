import { z } from "zod";
import type { Output, Snapshot } from "../engine/snapshot.js";
import {
  lengthFramesOf,
  outputLabel,
  timelineOf,
} from "../timeline/timelineFacts.js";

export type JobState =
  | { kind: "waiting" }
  | { kind: "rendering"; framesDone: number; frameCount: number | undefined }
  | { kind: "done"; file: string; fileName: string; durationSeconds: number }
  | { kind: "failed"; message: string; hint: string | undefined };

export interface RenderJob {
  callId: string;
  outputId: string;
  state: JobState;
}

export const renderResultSchema = z.object({
  file: z.string(),
  duration_seconds: z.number(),
});

export const renderFailureSchema = z.object({
  message: z.string(),
  hint: z.string().optional(),
});

export const progressEventSchema = z.object({
  type: z.literal("call-progress"),
  callId: z.string(),
  done: z.number(),
  total: z.number().optional(),
});

export function fileNameOf(file: string): string {
  return file.split(/[\\/]/).pop() ?? file;
}

function secondsWords(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;
  return `${String(rounded)} ${rounded === 1 ? "second" : "seconds"}`;
}

export function outputFactsOf(options: {
  snapshot: Snapshot;
  output: Output;
}): { lengthFrames: number; description: string } {
  const { snapshot, output } = options;
  const lengthFrames = lengthFramesOf(
    timelineOf({ snapshot, outputId: output.id }),
  );
  const size = `${String(output.widthPixels)} by ${String(output.heightPixels)}`;
  const length =
    lengthFrames === 0
      ? "no clips yet"
      : secondsWords(lengthFrames / snapshot.project.framesPerSecond);
  return {
    lengthFrames,
    description: `${outputLabel(output)}, ${size}, ${length}`,
  };
}

export function framesShareOf(jobs: RenderJob[]): number {
  const shares = jobs.map((job) => {
    if (job.state.kind === "done" || job.state.kind === "failed") return 1;
    if (job.state.kind === "waiting") return 0;
    const { framesDone, frameCount } = job.state;
    return frameCount === undefined || frameCount === 0
      ? 0
      : framesDone / frameCount;
  });
  const total = shares.reduce((...[sum, share]) => sum + share, 0);
  return jobs.length === 0 ? 0 : total / jobs.length;
}

export function renderButtonLabel(options: {
  jobs: RenderJob[];
  isRunning: boolean;
}): string {
  if (!options.isRunning) return "Render";
  const percent = Math.floor(framesShareOf(options.jobs) * 100);
  return `Rendering ${String(percent)}%`;
}
