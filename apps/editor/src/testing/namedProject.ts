import type { RunningEngine } from "./runEngine.js";

export const namedIds = {
  scenes: ["s-q7", "s-k2", "s-m4"],
  assets: ["img-x1", "aud-v9", "aud-t3", "vid-w5"],
} as const;

const sceneTitles = [
  ["s-q7", "Morning walk", "Fresh air"],
  ["s-k2", "Harbor view", "Boats at rest"],
  ["s-m4", "Closing words", "See you soon"],
] as const;

async function makeAssets(engine: RunningEngine): Promise<void> {
  const requests = [
    [
      "img-x1",
      "image",
      { prompt: "A quiet harbor at dawn", width_pixels: 64, height_pixels: 36 },
    ],
    ["aud-v9", "speech", { text: "Fresh air, boats at rest, see you soon." }],
    ["aud-t3", "music", { prompt: "A slow warm tune", duration_seconds: 3 }],
    [
      "vid-w5",
      "video",
      {
        prompt: "Waves on a pier",
        duration_seconds: 1,
        width_pixels: 64,
        height_pixels: 36,
      },
    ],
  ] as const;
  for (const [assetId, capability, input] of requests) {
    await engine.callTool({
      name: "generate_asset",
      input: { asset_id: assetId, capability, server: "sample", input },
    });
  }
}

async function placeEverything(options: {
  engine: RunningEngine;
  outputId: string;
}): Promise<void> {
  const { engine, outputId } = options;
  await engine.callTool({
    name: "set_timeline",
    input: {
      output_id: outputId,
      tracks: [
        {
          id: "row",
          kind: "scene",
          clips: sceneTitles.map((...[[sceneId], index]) => ({
            id: `c-${String(index)}`,
            scene_id: sceneId,
            start_frame: index * 30,
            duration_frames: 30,
          })),
        },
        { id: "speech", kind: "audio", clips: [] },
        {
          id: "bed",
          kind: "audio",
          clips: [
            {
              id: "m-1",
              asset_id: "aud-t3",
              start_frame: 0,
              duration_frames: 90,
              gain_decibels: -12,
            },
          ],
        },
      ],
    },
  });
  await engine.callTool({
    name: "place_narration",
    input: {
      output_id: outputId,
      asset_id: "aud-v9",
      start_frame: 0,
      with_captions: true,
    },
  });
  await engine.callTool({
    name: "place_video",
    input: { output_id: outputId, asset_id: "vid-w5", replace_clip_id: "c-1" },
  });
}

export async function buildNamedProject(engine: RunningEngine): Promise<void> {
  for (const [sceneId, title, words] of sceneTitles) {
    await engine.callTool({
      name: "put_scene",
      input: {
        scene_id: sceneId,
        title,
        kit_component: "title-card",
        props: { heading: words },
      },
    });
  }
  await makeAssets(engine);
  for (const outputId of ["wide", "tall"]) {
    await placeEverything({ engine, outputId });
  }
}
