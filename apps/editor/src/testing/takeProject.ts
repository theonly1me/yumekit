import { z } from "zod";
import { counterCode } from "./counterProject.js";
import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

export const pictureIds = ["ferry", "harbor", "lantern"];

function picture(assetId: string) {
  return {
    asset_id: assetId,
    capability: "image",
    server: "sample",
    input: {
      prompt: `The ${assetId} in fog`,
      width_pixels: 320,
      height_pixels: 180,
    },
  };
}

export async function openPicturesTake(options: {
  engine: RunningEngine;
  assetIds: string[];
}): Promise<void> {
  const { engine } = options;
  await engine.callTool({
    name: "open_take",
    input: { step: "pictures", chapter_id: "film" },
  });
  await engine.callTool({
    name: "generate_assets",
    input: { calls: options.assetIds.map(picture) },
  });
}

export async function readyTake(options: {
  engine: RunningEngine;
  items: { id: string; what_to_check?: string; replaces_asset_id?: string }[];
  nextStepEstimateUsd?: number;
}): Promise<void> {
  await options.engine.callTool({
    name: "ready_take",
    input: {
      items: options.items.map((item) => ({
        note: `The lead's note on ${item.id}.`,
        ...item,
      })),
      ...(options.nextStepEstimateUsd === undefined
        ? {}
        : { next_step_estimate_usd: options.nextStepEstimateUsd }),
    },
  });
}

export async function readyMusicTake(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "open_take",
    input: { step: "clips", chapter_id: "film" },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "strings",
      capability: "music",
      server: "sample",
      input: { prompt: "Low strings", duration_seconds: 4 },
    },
  });
  await readyTake({
    engine,
    items: [
      { id: "strings", what_to_check: "Listen for the swell at 2.0 seconds." },
    ],
  });
}

export async function readyCutTake(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "put_scene",
    input: { scene_id: "counter", title: "Counter", code: counterCode },
  });
  await engine.callTool({
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        {
          id: "scenes",
          kind: "scene",
          clips: [
            {
              id: "counter",
              scene_id: "counter",
              start_frame: 0,
              duration_frames: 30,
            },
          ],
        },
      ],
    },
  });
  await engine.callTool({
    name: "open_take",
    input: { step: "cut", chapter_id: "film" },
  });
  await engine.callTool({
    name: "render_video",
    input: { output_id: "wide", chapter_id: "film" },
  });
  await readyTake({
    engine,
    items: [{ id: "cut", what_to_check: "Watch it once at full speed." }],
  });
}

const takesSchema = z.object({
  takes: z.array(
    z.object({
      number: z.number(),
      state: z.string(),
      notes: z.array(z.looseObject({ itemId: z.string() })),
    }),
  ),
});

export async function takesOf(engine: RunningEngine) {
  return takesSchema.parse(await engineRequest({ engine, path: "/api/takes" }))
    .takes;
}
