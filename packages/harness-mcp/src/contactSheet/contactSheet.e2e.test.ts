import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const blankCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => (
  <div style={{ position: "absolute", inset: 0, background: "#000000" }} />
));
`;

async function thirtySecondVideo(): Promise<Harness> {
  const harness = await startHarness();
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "intro",
      title: "Intro",
      kit_component: "title-card",
      props: { heading: "Launch" },
    },
  });
  await harness.call({
    name: "put_scene",
    arguments: { scene_id: "blank", title: "Blank", code: blankCode },
  });
  await harness.call({ name: "set_tempo", arguments: { tempo: 120 } });
  await harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: [
        {
          id: "main",
          kind: "scene",
          clips: [
            { id: "one", scene_id: "intro", start_beat: 0, duration_beats: 30 },
            { id: "gap", scene_id: "blank", start_beat: 30, duration_beats: 2 },
            {
              id: "two",
              scene_id: "intro",
              start_beat: 32,
              duration_beats: 28,
              transition: { kind: "fade", duration_beats: 1 },
            },
          ],
        },
      ],
    },
  });
  return harness;
}

describe("contact_sheet", () => {
  it("gives one picture of a 30 second video with 30 frames and their times and beats", async () => {
    const harness = await thirtySecondVideo();

    const sheet = await harness.call({
      name: "contact_sheet",
      arguments: { output_id: "wide" },
    });
    const images = sheet.result.content.filter(
      (block) => block.type === "image",
    );
    const frames = Array.isArray(sheet.data["frames"])
      ? sheet.data["frames"]
      : [];

    expect(images).toHaveLength(1);
    expect(frames).toHaveLength(30);
    expect(frames[4]).toEqual({ frame: 120, seconds: 4, beat: 8 });
    expect(frames.at(-1)).toEqual({ frame: 870, seconds: 29, beat: 58 });
  });

  it("names a frame that is one color, and a transition that runs at a beat that must cut", async () => {
    const harness = await thirtySecondVideo();

    const sheet = await harness.call({
      name: "contact_sheet",
      arguments: { output_id: "wide", beat_cuts: [32] },
    });

    expect(sheet.data["warnings"]).toEqual([
      expect.objectContaining({ kind: "one-color", frame: 450, beat: 30 }),
      expect.objectContaining({
        kind: "transition-at-beat-cut",
        frame: 480,
        beat: 32,
      }),
    ]);
    expect(sheet.text).toContain("is one color (#000000)");
  });

  it("takes a larger step for a long video, so the sheet keeps at most 60 frames", async () => {
    const harness = await thirtySecondVideo();

    const sheet = await harness.call({
      name: "contact_sheet",
      arguments: { output_id: "wide", every_seconds: 0.25 },
    });

    expect(sheet.data).toMatchObject({ every_seconds: 0.5 });
    expect(
      Array.isArray(sheet.data["frames"]) && sheet.data["frames"].length,
    ).toBe(60);
  });
});
