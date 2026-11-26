import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";
import {
  openPicturesTake,
  readyCutTake,
  readyMusicTake,
  readyTake,
} from "./takeProject.js";

export async function sendWithNoTurn(options: {
  engine: RunningEngine;
  takeId: string;
}): Promise<void> {
  await engineRequest({
    engine: options.engine,
    path: `/api/takes/${options.takeId}/send`,
    method: "POST",
    body: { next: "stop" },
  });
}

export async function openMusicTake(options: {
  engine: RunningEngine;
  assetId: string;
}): Promise<void> {
  const { engine, assetId } = options;
  await engine.callTool({
    name: "open_take",
    input: { step: "clips", chapter_id: "film" },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: assetId,
      capability: "music",
      server: "sample",
      input: { prompt: `The ${assetId}`, duration_seconds: 2 },
    },
  });
}

export async function readyMusic(options: {
  engine: RunningEngine;
  assetId: string;
}): Promise<void> {
  await readyTake({
    engine: options.engine,
    items: [{ id: options.assetId, what_to_check: "Listen once." }],
  });
}

export async function makeOwnersTakes(engine: RunningEngine): Promise<void> {
  await openPicturesTake({ engine, assetIds: ["ferry"] });
  await readyTake({ engine, items: [{ id: "ferry" }] });
  await sendWithNoTurn({ engine, takeId: "take-1" });
  await readyMusicTake(engine);
  await readyCutTake(engine);
  await openPicturesTake({ engine, assetIds: ["harbor"] });
  await readyTake({ engine, items: [{ id: "harbor" }] });
  await sendWithNoTurn({ engine, takeId: "take-4" });
  await openMusicTake({ engine, assetId: "bells" });
  await readyMusic({ engine, assetId: "bells" });
  await sendWithNoTurn({ engine, takeId: "take-5" });
  await openMusicTake({ engine, assetId: "drums" });
}
