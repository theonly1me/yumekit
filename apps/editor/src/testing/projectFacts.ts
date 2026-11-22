import { z } from "zod";
import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

const projectSchema = z.object({
  timelines: z.array(
    z.object({
      outputId: z.string(),
      tracks: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          off: z.boolean().optional(),
          clips: z.array(
            z.object({
              id: z.string(),
              sceneId: z.string().optional(),
              startFrame: z.number(),
              durationFrames: z.number(),
            }),
          ),
        }),
      ),
    }),
  ),
});

async function tracksOf(options: { engine: RunningEngine; outputId: string }) {
  const { timelines } = projectSchema.parse(
    await engineRequest({ engine: options.engine, path: "/api/project" }),
  );
  return timelines
    .filter((timeline) => timeline.outputId === options.outputId)
    .flatMap((timeline) => timeline.tracks);
}

export async function scenesRowClipsOf(options: {
  engine: RunningEngine;
  outputId: string;
}) {
  const [row] = (await tracksOf(options)).filter(
    (track) => track.id === "scenes",
  );
  return [...(row?.clips ?? [])].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
}

export async function isTrackOff(options: {
  engine: RunningEngine;
  outputId: string;
  trackId: string;
}): Promise<boolean> {
  const track = (await tracksOf(options)).find(
    (candidate) => candidate.id === options.trackId,
  );
  return track?.off === true;
}
