import { describe, expect, it } from "vitest";
import type { Asset, Timeline } from "../engine/snapshot.js";
import { soundRowsOf } from "./soundRowFacts.js";

function audioClip(options: { id: string; assetId: string }) {
  return {
    id: options.id,
    assetId: options.assetId,
    startFrame: 0,
    durationFrames: 30,
    assetStartFrame: 0,
    gainDecibels: 0,
  };
}

const assets: Asset[] = [
  {
    id: "tune",
    kind: "audio",
    hasWords: false,
    source: { kind: "import", originalName: "Tune.wav" },
  },
];

const timeline: Timeline = {
  outputId: "wide",
  tracks: [
    {
      id: "music",
      kind: "audio",
      clips: [audioClip({ id: "tune-clip", assetId: "tune" })],
    },
    {
      id: "sounds",
      kind: "audio",
      clips: [
        audioClip({ id: "door", assetId: "door" }),
        audioClip({ id: "bell", assetId: "bell" }),
      ],
    },
    { id: "sounds-2", kind: "audio", clips: [] },
  ],
};

describe("the sound rows", () => {
  it("gives each sounds track a Sounds row with its count, and never a music row", () => {
    const rows = soundRowsOf({ timeline, scenes: [], assets });

    expect(
      rows.map((row) => [row.trackId, row.name, row.part, row.choice]),
    ).toEqual([
      ["music", "Music", "music", "Tune.wav"],
      ["sounds", "Sounds", "music", "2 sounds"],
      ["sounds-2", "Sounds 2", "music", "No sounds yet"],
    ]);
  });
});
