import type { RunningEngine } from "./runEngine.js";
import { buildSoundProject } from "./soundProject.js";

async function madePicture(options: {
  engine: RunningEngine;
  assetId: string;
  prompt: string;
}): Promise<void> {
  await options.engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: options.assetId,
      capability: "image",
      server: "sample",
      input: { prompt: options.prompt, width_pixels: 64, height_pixels: 36 },
    },
  });
}

export async function buildFilesProject(engine: RunningEngine): Promise<void> {
  await buildSoundProject(engine);
  await madePicture({ engine, assetId: "lake", prompt: "A quiet lake" });
  await madePicture({ engine, assetId: "spare", prompt: "A spare sky" });
  await engine.callTool({
    name: "put_scene",
    input: {
      scene_id: "second",
      title: "Second counter",
      kit_component: "image-pan",
      props: { assetId: "lake" },
    },
  });
}
