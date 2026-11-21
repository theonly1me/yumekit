import { z } from "zod";
import { counterCode } from "./counterProject.js";
import type { RunningEngine } from "./runEngine.js";

export const clipLengthFrames = 30;

export const kitScenes = [
  {
    scene_id: "opening",
    title: "Opening title",
    kit_component: "title-card",
    props: { heading: "First heading", subheading: "A small line" },
  },
  {
    scene_id: "points",
    title: "Points",
    kit_component: "bullet-list",
    props: { heading: "Points", items: ["Alpha", "Beta", "Gamma"] },
  },
  {
    scene_id: "chart",
    title: "Chart",
    kit_component: "bar-chart",
    props: { heading: "Costs", bars: [{ label: "Rent", value: 40 }] },
  },
  {
    scene_id: "harbor",
    title: "Harbor",
    kit_component: "image-pan",
    props: { assetId: "harbor-still" },
  },
  {
    scene_id: "closing",
    title: "Closing line",
    kit_component: "quote",
    props: { quote: "Every frame stays editable." },
  },
] as const;

const allScenes = [
  ...kitScenes.map((scene) => scene.scene_id),
  "counter",
] as const;

export async function buildKitSceneProject(
  engine: RunningEngine,
): Promise<void> {
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "harbor-still",
      capability: "image",
      server: "sample",
      input: { prompt: "Harbor", width_pixels: 320, height_pixels: 180 },
    },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      server: "sample",
      input: { text: "A short line" },
    },
  });
  for (const scene of kitScenes) {
    await engine.callTool({ name: "put_scene", input: scene });
  }
  await engine.callTool({
    name: "put_scene",
    input: { scene_id: "counter", title: "Frame counter", code: counterCode },
  });
  for (const outputId of ["wide", "tall"]) {
    await engine.callTool({
      name: "set_timeline",
      input: {
        output_id: outputId,
        tracks: [
          {
            id: "scenes",
            kind: "scene",
            clips: allScenes.map((...[sceneId, index]) => ({
              id: sceneId,
              scene_id: sceneId,
              start_frame: index * clipLengthFrames,
              duration_frames: clipLengthFrames,
            })),
          },
        ],
      },
    });
  }
}

const projectSchema = z.object({
  scenes: z.array(
    z.object({
      id: z.string(),
      source: z.object({ props: z.record(z.string(), z.json()) }),
    }),
  ),
});

export async function storedPropsOf(options: {
  engine: RunningEngine;
  sceneId: string;
}): Promise<unknown> {
  const response = await fetch(`${options.engine.origin}/api/project`, {
    headers: { authorization: `Bearer ${options.engine.token}` },
  });
  const project = projectSchema.parse(await response.json());
  return project.scenes.find((scene) => scene.id === options.sceneId)?.source
    .props;
}
