import type { MadeBy } from "@yumekit/project";
import type { JsonObject } from "@yumekit/tools";
import type { Harness } from "../index.js";
import { startFunctionHarness } from "./functionHarness.js";

const wideOutput = {
  id: "wide",
  label: "Wide",
  widthPixels: 320,
  heightPixels: 180,
};

export function callAs(options: {
  harness: Harness;
  by: MadeBy;
  name: string;
  input: JsonObject;
}) {
  const { harness, by, name, input } = options;
  return harness.call({ name, input, by });
}

export const scenesRowOfAgent = {
  id: "main",
  kind: "scene",
  clips: [
    { id: "first", scene_id: "a", start_frame: 0, duration_frames: 30 },
    { id: "second", scene_id: "b", start_frame: 30, duration_frames: 30 },
    { id: "third", scene_id: "c", start_frame: 60, duration_frames: 30 },
  ],
};

async function asPerson(options: {
  harness: Harness;
  name: string;
  input: JsonObject;
}) {
  const result = await callAs({ ...options, by: "person" });
  if (result.isError) throw new Error(result.text);
  return result;
}

export async function projectWithPersonWork() {
  const { harness, store } = await startFunctionHarness({
    outputs: [wideOutput],
  });
  for (const [sceneId, heading] of [
    ["a", "A"],
    ["b", "B"],
    ["c", "C"],
  ] as const) {
    await callAs({
      harness,
      by: "ai",
      name: "put_scene",
      input: {
        scene_id: sceneId,
        title: heading,
        kit_component: "title-card",
        props: { heading },
      },
    });
  }
  await callAs({
    harness,
    by: "ai",
    name: "set_timeline",
    input: { output_id: "wide", tracks: [scenesRowOfAgent] },
  });
  await asPerson({
    harness,
    name: "generate_asset",
    input: {
      asset_id: "calm-pad",
      capability: "music",
      input: { prompt: "Calm pad", duration_seconds: 3 },
    },
  });
  await asPerson({
    harness,
    name: "generate_asset",
    input: {
      asset_id: "waves",
      capability: "video",
      input: { prompt: "waves", duration_seconds: 1, with_audio: false },
    },
  });
  await asPerson({
    harness,
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        scenesRowOfAgent,
        {
          id: "music",
          kind: "audio",
          clips: [
            {
              id: "music-1",
              asset_id: "calm-pad",
              start_frame: 0,
              duration_frames: 90,
            },
          ],
        },
      ],
    },
  });
  await asPerson({
    harness,
    name: "place_video",
    input: { output_id: "wide", asset_id: "waves", replace_clip_id: "second" },
  });
  await asPerson({
    harness,
    name: "set_transitions",
    input: { kind: "slide" },
  });
  return { harness, store };
}
