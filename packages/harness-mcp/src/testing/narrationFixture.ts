import { startHarness, type Harness } from "./harnessFixture.js";

export async function harnessWithSpeech(): Promise<Harness> {
  const harness = await startHarness();
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "intro",
      title: "Intro",
      kit_component: "title-card",
      props: { heading: "Hi" },
    },
  });
  await harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: [
        {
          id: "main",
          kind: "scene",
          clips: [{ scene_id: "intro", start_frame: 0, duration_frames: 90 }],
        },
      ],
    },
  });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "line-one",
      capability: "speech",
      input: { text: "one two three four" },
    },
  });
  return harness;
}

export function timelineOf(harness: Harness) {
  const [timeline] = harness.store.read().timelines;
  if (!timeline) throw new Error("The output has no timeline");
  return timeline;
}
