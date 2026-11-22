import { startHarness, type Harness } from "./harnessFixture.js";

export const tallOutput = {
  id: "tall",
  label: "Tall",
  widthPixels: 180,
  heightPixels: 320,
};

const wideOutput = {
  id: "wide",
  label: "Wide",
  widthPixels: 320,
  heightPixels: 180,
};

async function putScenes(harness: Harness): Promise<void> {
  for (const [sceneId, heading] of [
    ["a", "A"],
    ["b", "B"],
    ["c", "C"],
  ]) {
    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: sceneId,
        title: heading,
        kit_component: "title-card",
        props: { heading },
      },
    });
  }
}

export async function harnessWithThreeScenes(options?: {
  withVoice?: boolean;
}): Promise<Harness> {
  const harness = await startHarness({ outputs: [wideOutput, tallOutput] });
  await putScenes(harness);
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "tune",
      capability: "music",
      input: { prompt: "calm", duration_seconds: 1 },
    },
  });
  const scenesRow = {
    id: "main",
    kind: "scene",
    clips: [
      { id: "one", scene_id: "a", start_frame: 0, duration_frames: 30 },
      { id: "two", scene_id: "b", start_frame: 30, duration_frames: 20 },
      { id: "three", scene_id: "c", start_frame: 50, duration_frames: 40 },
    ],
  };
  const music = {
    id: "music",
    kind: "audio",
    clips: [
      { id: "tune", asset_id: "tune", start_frame: 0, duration_frames: 30 },
    ],
  };
  await harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks:
        options?.withVoice === true
          ? [scenesRow, { id: "voice", kind: "audio", clips: [] }, music]
          : [scenesRow, music],
    },
  });
  if (options?.withVoice === true) {
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "line",
        capability: "speech",
        input: { text: "one two three four" },
      },
    });
    const placed = await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "line",
        start_frame: 0,
        with_captions: true,
      },
    });
    if (placed.isError) throw new Error(placed.text);
  }
  await harness.call({
    name: "copy_timeline",
    arguments: { from_output_id: "wide", to_output_id: "tall" },
  });
  return harness;
}

export function rowOf(options: { harness: Harness; outputId: string }) {
  const timeline = options.harness.store
    .read()
    .timelines.find((candidate) => candidate.outputId === options.outputId);
  const row = timeline?.tracks.find((track) => track.id === "main");
  if (row?.kind !== "scene") throw new Error("The output has no scenes row");
  return [...row.clips]
    .sort((...[first, second]) => first.startFrame - second.startFrame)
    .map((clip) => [
      clip.id,
      clip.sceneId,
      clip.startFrame,
      clip.durationFrames,
    ]);
}

export function nonRowTracksOf(options: {
  harness: Harness;
  outputId: string;
}) {
  return options.harness.store
    .read()
    .timelines.find((candidate) => candidate.outputId === options.outputId)
    ?.tracks.filter((track) => track.id !== "main");
}
