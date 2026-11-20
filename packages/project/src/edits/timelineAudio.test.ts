import { describe, expect, it } from "vitest";
import type { Edit } from "../index.js";
import {
  addAudioAsset,
  createTestProject,
} from "../testing/projectFixtures.js";

function audioTimeline(clip: {
  assetId: string;
  durationFrames: number;
  assetStartFrame: number;
}): Edit {
  return {
    kind: "setTimeline",
    timeline: {
      outputId: "wide",
      tracks: [
        {
          id: "narration",
          kind: "audio",
          clips: [{ id: "line", startFrame: 0, gainDecibels: -3, ...clip }],
        },
      ],
    },
  };
}

describe("timeline edits with audio clips", () => {
  it("setTimeline refuses an audio clip that reads past the end of its asset", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 90,
    });
    const fits = await store.applyEdits([
      addVoice,
      audioTimeline({
        assetId: "voice",
        durationFrames: 60,
        assetStartFrame: 30,
      }),
    ]);
    expect(fits.ok).toBe(true);
    const result = await store.applyEdits([
      audioTimeline({
        assetId: "voice",
        durationFrames: 60,
        assetStartFrame: 31,
      }),
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("setTimeline refuses an audio clip of an asset that is not audio", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 90,
    });
    const imageEdit: Edit = {
      ...addVoice,
      asset: { ...addVoice.asset, kind: "image" },
    };
    const result = await store.applyEdits([
      imageEdit,
      audioTimeline({
        assetId: "voice",
        durationFrames: 30,
        assetStartFrame: 0,
      }),
    ]);
    expect(result.ok || result.failure).toMatchObject({
      kind: "invalid-value",
      editIndex: 1,
    });
  });
});
