import { z } from "zod";
import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

export function clipCall(options: { assetId: string; prompt: string }) {
  return {
    asset_id: options.assetId,
    capability: "video",
    server: "sample",
    input: {
      prompt: options.prompt,
      duration_seconds: 2,
      width_pixels: 320,
      height_pixels: 180,
    },
  };
}

export function musicCall(options: { assetId: string; prompt: string }) {
  return {
    asset_id: options.assetId,
    capability: "music",
    server: "sample",
    input: { prompt: options.prompt, duration_seconds: 4 },
  };
}

export async function makeInTake(options: {
  engine: RunningEngine;
  step: "pictures" | "clips";
  calls: object[];
}): Promise<void> {
  await options.engine.callTool({
    name: "open_take",
    input: { step: options.step, chapter_id: "film" },
  });
  await options.engine.callTool({
    name: "generate_assets",
    input: { calls: options.calls },
  });
}

const draftSchema = z.object({
  items: z.record(z.string(), z.looseObject({ note: z.string() })),
});

export async function savedDraftOf(options: {
  engine: RunningEngine;
  takeId: string;
}) {
  return draftSchema.parse(
    await engineRequest({
      engine: options.engine,
      path: `/api/take-drafts/${options.takeId}`,
    }),
  ).items;
}

const sentSchema = z.object({
  takes: z.array(
    z.object({
      id: z.string(),
      state: z.string(),
      items: z.array(z.looseObject({ id: z.string() })),
      notes: z.array(z.looseObject({ itemId: z.string() })),
    }),
  ),
});

export async function takeById(options: {
  engine: RunningEngine;
  takeId: string;
}) {
  const { takes } = sentSchema.parse(
    await engineRequest({ engine: options.engine, path: "/api/takes" }),
  );
  return takes.find((take) => take.id === options.takeId);
}
