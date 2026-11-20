import { describe, expect, it } from "vitest";
import { mountKitScene } from "../testing/mountKitScene.js";

describe("paper style pack fonts", () => {
  it("loads both bundled fonts before the first frame", async () => {
    const { mounted } = await mountKitScene({
      name: "title-card",
      durationFrames: 1,
      props: { heading: "Fonts" },
    });
    await mounted.seek(0);
    const loaded = [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => `${face.family} ${face.weight}`)
      .toSorted();
    expect(loaded).toEqual(["Zen Kaku Gothic New 500", "Zen Maru Gothic 700"]);
  });
});
