import { z } from "zod";
import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

async function approvedTake(options: {
  engine: RunningEngine;
  takeId: string;
  step: "pictures" | "clips";
  assetIds: string[];
}): Promise<void> {
  const { engine } = options;
  await engine.callTool({
    name: "open_take",
    input: { step: options.step, chapter_id: "harbor" },
  });
  await engine.callTool({
    name: "ready_take",
    input: {
      items: options.assetIds.map((id) => ({
        id,
        note: `The ${id}.`,
        ...(options.step === "clips" ? { what_to_check: "The water." } : {}),
      })),
    },
  });
  await engineRequest({
    engine,
    path: `/api/takes/${options.takeId}/send`,
    method: "POST",
    body: { notes: [] },
  });
}

export async function approveFirstChapter(
  engine: RunningEngine,
): Promise<void> {
  await approvedTake({
    engine,
    takeId: "take-1",
    step: "pictures",
    assetIds: ["a-start", "b-start"],
  });
  await approvedTake({
    engine,
    takeId: "take-2",
    step: "clips",
    assetIds: ["a-clip", "b-clip"],
  });
}

const musicSchema = z.object({
  timelines: z.array(
    z.object({
      tracks: z.array(
        z.object({
          id: z.string(),
          clips: z.array(
            z.object({ startFrame: z.number(), durationFrames: z.number() }),
          ),
        }),
      ),
    }),
  ),
});

export async function musicText(engine: RunningEngine): Promise<string> {
  const { timelines } = musicSchema.parse(
    await engineRequest({ engine, path: "/api/project" }),
  );
  const music = timelines
    .flatMap((timeline) => timeline.tracks)
    .find((track) => track.id === "music");
  return (music?.clips ?? [])
    .map((clip) => `${String(clip.startFrame)}+${String(clip.durationFrames)}`)
    .join(" ");
}
