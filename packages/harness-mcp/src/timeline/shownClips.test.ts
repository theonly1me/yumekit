import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import {
  checkedByLead,
  startDraftStory,
} from "../testing/leadDesignFixture.js";

const strike = { shot_id: "strike" };

async function clipOfStrike(options: { checked: boolean }): Promise<Harness> {
  const harness = await startDraftStory(["strike"]);
  await harness.call({
    name: "generate_asset",
    arguments: {
      ...strike,
      asset_id: "strike-start",
      capability: "image",
      input: { width_pixels: 32, height_pixels: 18 },
    },
  });
  await checkedByLead({
    harness,
    targets: [{ ...strike, asset_id: "strike-start" }],
  });
  await harness.call({
    name: "generate_asset",
    arguments: {
      ...strike,
      asset_id: "strike-clip",
      capability: "video",
      first_frame_asset_id: "strike-start",
      input: { duration_seconds: 4 },
    },
  });
  if (options.checked) {
    await checkedByLead({
      harness,
      targets: [{ ...strike, asset_id: "strike-clip" }],
      designBreak: { question: 2, fromSeconds: 2 },
    });
  }
  return harness;
}

const videoScene = {
  scene_id: "strike-video",
  title: "Strike",
  kit_component: "video-clip",
  props: { assetId: "strike-clip" },
};

function tracksShowing(durationFrames: number) {
  return [
    {
      id: "scenes",
      kind: "scene",
      clips: [
        {
          id: "strike-shot",
          scene_id: "strike-video",
          start_frame: 0,
          duration_frames: durationFrames,
        },
      ],
    },
  ];
}

function setTimeline(options: { harness: Harness; durationFrames: number }) {
  return options.harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: tracksShowing(options.durationFrames),
    },
  });
}

describe(
  "a clip of a shot on a timeline written in one call",
  { timeout: 120_000 },
  () => {
    it("set_timeline shows only the clean part of a clip whose design breaks", async () => {
      const harness = await clipOfStrike({ checked: true });
      await harness.call({ name: "put_scene", arguments: videoScene });

      const whole = await setTimeline({ harness, durationFrames: 120 });
      const clean = await setTimeline({ harness, durationFrames: 52 });

      expect(whole.data).toMatchObject({ kind: "design-break-in-range" });
      expect(whole.text).toContain("at most 52");
      expect(clean.isError).toBe(false);
    });

    it("set_timeline counts the start of a video scene inside its clip, so a later start cannot show the break", async () => {
      const harness = await clipOfStrike({ checked: true });
      const startingAt = (startSeconds: number) =>
        harness.call({
          name: "put_scene",
          arguments: {
            ...videoScene,
            props: { assetId: "strike-clip", startSeconds },
          },
        });

      await startingAt(1);
      const late = await setTimeline({ harness, durationFrames: 30 });
      await startingAt(0.5);
      const early = await setTimeline({ harness, durationFrames: 30 });

      expect(late.data).toMatchObject({ kind: "design-break-in-range" });
      expect(early.isError).toBe(false);
    });

    it("set_timeline refuses a clip with no design check", async () => {
      const harness = await clipOfStrike({ checked: false });
      await harness.call({ name: "put_scene", arguments: videoScene });

      const refused = await setTimeline({ harness, durationFrames: 30 });

      expect(refused.data).toMatchObject({ kind: "design-not-checked" });
    });

    it("put_work shows only the clean part of a clip whose design breaks, and refuses a clip with no check", async () => {
      const checked = await clipOfStrike({ checked: true });
      const unchecked = await clipOfStrike({ checked: false });
      const workShowing = (durationFrames: number) => ({
        scenes: [videoScene],
        timelines: [
          { output_id: "wide", tracks: tracksShowing(durationFrames) },
        ],
      });

      const whole = await checked.call({
        name: "put_work",
        arguments: workShowing(120),
      });
      const clean = await checked.call({
        name: "put_work",
        arguments: workShowing(52),
      });
      const refused = await unchecked.call({
        name: "put_work",
        arguments: workShowing(30),
      });

      expect(whole.data).toMatchObject({ kind: "design-break-in-range" });
      expect(clean.isError).toBe(false);
      expect(refused.data).toMatchObject({ kind: "design-not-checked" });
    });
  },
);
