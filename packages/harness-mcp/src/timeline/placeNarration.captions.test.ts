import { describe, expect, it } from "vitest";
import { harnessWithSpeech, timelineOf } from "../testing/narrationFixture.js";

describe("the captions of a new voice", () => {
  it("come with a voice that has word timings when the call does not name with_captions", async () => {
    const harness = await harnessWithSpeech();

    await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "line-one",
        start_frame: 0,
        partial: true,
      },
    });

    expect(timelineOf(harness).tracks.map((track) => track.id)).toEqual([
      "main",
      "captions",
      "narration",
    ]);
  });
});
