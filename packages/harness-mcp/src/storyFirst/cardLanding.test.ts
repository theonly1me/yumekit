import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { setPlan } from "../testing/storyFixture.js";

const runFile = promisify(execFile);

const bursts =
  "0.003*sin(2*PI*220*t)+0.8*sin(2*PI*90*t)*(gte(t,1)*exp(-6*(t-1))+gte(t,2.5)*exp(-6*(t-2.5)))";

async function burstTrack(harness: Harness): Promise<void> {
  const file = join(harness.folder, "..", "bursts.wav");
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", `aevalsrc=exprs='${bursts}':d=3:s=48000`, file],
  ]);
  await harness.call({
    name: "import_asset",
    arguments: { asset_id: "bursts", kind: "audio", source_path: file },
  });
}

function putCard(options: {
  harness: Harness;
  sceneId: string;
  props?: Record<string, unknown>;
}) {
  return options.harness.call({
    name: "put_scene",
    arguments: {
      scene_id: options.sceneId,
      title: options.sceneId,
      kit_component: "trailer-card",
      props: { lines: ["Tonight it rang"], ...options.props },
    },
  });
}

function timelineWithCards(options: {
  harness: Harness;
  cardStarts: number[];
}) {
  return options.harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: [
        {
          id: "cards",
          kind: "scene",
          clips: options.cardStarts.map((...[start, index]) => ({
            id: `card-clip-${String(index + 1)}`,
            scene_id: `card-${String(index + 1)}`,
            start_frame: start,
            duration_frames: 10,
          })),
        },
        {
          id: "music",
          kind: "audio",
          clips: [{ asset_id: "bursts", start_frame: 0, duration_frames: 90 }],
        },
      ],
    },
  });
}

describe("where a trailer card lands", () => {
  it("measures the hits of the music, and says that a card on a hit lands on it", async () => {
    const harness = await startHarness();
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    await burstTrack(harness);
    await harness.call({ name: "set_tempo", arguments: { tempo: 120 } });
    await putCard({ harness, sceneId: "card-1" });
    await putCard({ harness, sceneId: "card-2" });
    await putCard({ harness, sceneId: "card-3" });

    await harness.call({
      name: "check_music",
      arguments: { asset_id: "bursts" },
    });
    const hits =
      harness.store.read().bible.storyPlan?.musicChecks?.[0]?.hits ?? [];
    const result = await timelineWithCards({
      harness,
      cardStarts: [30, 60, 49],
    });

    expect(hits).toHaveLength(2);
    expect(hits[0]).toBeCloseTo(1, 1);
    expect(hits[1]).toBeCloseTo(2.5, 1);
    expect(result.data["card_landings"]).toMatchObject([
      { scene_id: "card-1", lands_at_seconds: 1, lands_on: "hit" },
      { scene_id: "card-3", lands_at_seconds: 1.63, lands_on: "off" },
      { scene_id: "card-2", lands_at_seconds: 2, lands_on: "beat" },
    ]);
    expect(result.text).toContain(
      'Card "card-1" (clip "card-clip-1" of "wide") lands at 1s, on the measured hit at 1s of the music "bursts".',
    );
    expect(result.text).toContain(
      'Card "card-3" (clip "card-clip-3" of "wide") lands at 1.63s, between beats: the nearest beat is 3.5 at 1.77s. The nearest measured hits of the music are at 1s and 2.5s: move the clip so the words land on one.',
    );
  });

  it("lands a card on the beat grid when the music has no measured hits, and counts its beat", async () => {
    const harness = await startHarness();
    await burstTrack(harness);
    await harness.call({ name: "set_tempo", arguments: { tempo: 120 } });
    await putCard({ harness, sceneId: "card-1", props: { landsOnBeat: 2 } });

    const result = await timelineWithCards({ harness, cardStarts: [30] });

    expect(result.text).toContain(
      'Card "card-1" (clip "card-clip-1" of "wide") lands at 2s, on beat 4 of the grid. The music in the video has no measured hits: check_music measures them.',
    );
  });

  it("notes a card whose words have no story fact, or a fact that the story does not have", async () => {
    const harness = await startHarness();

    const noStory = await putCard({ harness, sceneId: "card-1" });
    await harness.call({
      name: "set_story",
      arguments: {
        premise: "A girl goes under the ice.",
        world: "A frozen lake.",
        world_rule: "The bell rings before a death.",
        characters: [
          {
            character_id: "oda",
            name: "Oda",
            background: "An orphan.",
            want: "her grandfather",
            fear: "a winter alone",
            does_not_know: "his secret",
          },
        ],
        opposing_force: {
          force_id: "keeper",
          name: "The Keeper",
          what: "A drowned miller.",
          why: "No one should die without a goodbye.",
        },
        arc: [
          { step_id: "one", step: "One." },
          { step_id: "two", step: "Two." },
          { step_id: "three", step: "Three." },
        ],
        unknown_at_end: "The end.",
      },
    });
    const noFact = await putCard({ harness, sceneId: "card-1" });
    const wrongFact = await putCard({
      harness,
      sceneId: "card-1",
      props: { storyFact: "ivo" },
    });
    const rightFact = await putCard({
      harness,
      sceneId: "card-1",
      props: { storyFact: "two" },
    });

    expect(noStory.text).toContain(
      'Note: card "card-1" ("Tonight it rang") has no story behind it.',
    );
    expect(noFact.text).toContain(
      'Note: card "card-1" ("Tonight it rang") names no storyFact. Each word on screen comes from the story: give the id of the part that it says (premise, world, oda, keeper, one, two, three, unknown).',
    );
    expect(wrongFact.data["card_notes"]).toEqual([
      'Note: card "card-1" names storyFact "ivo", which is not a part of the story. The parts: premise, world, oda, keeper, one, two, three, unknown.',
    ]);
    expect(rightFact.data["card_notes"]).toBeUndefined();
  });
});
