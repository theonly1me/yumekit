import { describe, expect, it } from "vitest";
import { shownTexts } from "../testing/contentBoxes.js";
import { mountKitScene } from "../testing/mountKitScene.js";

const speech = {
  kind: "audio" as const,
  url: "speech.wav",
  durationFrames: 40,
  words: [
    { text: "Every", startFrame: 0, endFrame: 9 },
    { text: "frame", startFrame: 10, endFrame: 19 },
    { text: "stays", startFrame: 20, endFrame: 29 },
    { text: "editable.", startFrame: 30, endFrame: 39 },
  ],
};

async function shownAtFrames(options: {
  props: { assetId?: string; text?: string };
  frames: number[];
}) {
  const { element, mounted } = await mountKitScene({
    name: "caption-words",
    durationFrames: 40,
    props: options.props,
    assets: { speech },
  });
  const shown: string[] = [];
  for (const frame of options.frames) {
    await mounted.seek(frame);
    shown.push(shownTexts(element).join(" "));
  }
  return shown;
}

describe("caption-words", () => {
  it("shows each word of the speech asset only from its start frame", async () => {
    expect(
      await shownAtFrames({
        props: { assetId: "speech", text: "unused text" },
        frames: [0, 9, 10, 19, 20, 30, 39],
      }),
    ).toEqual([
      "Every",
      "Every",
      "Every frame",
      "Every frame",
      "Every frame stays",
      "Every frame stays editable.",
      "Every frame stays editable.",
    ]);
  });

  it("spreads the text evenly over the clip when the asset has no words", async () => {
    expect(
      await shownAtFrames({
        props: { assetId: "missing", text: "one two three four" },
        frames: [0, 9, 10, 29, 30],
      }),
    ).toEqual(["one", "one", "one two", "one two three", "one two three four"]);
  });

  it("shows nothing before the first word starts", async () => {
    const { element, mounted } = await mountKitScene({
      name: "caption-words",
      durationFrames: 40,
      props: { assetId: "late" },
      assets: {
        late: {
          ...speech,
          words: [{ text: "Later", startFrame: 12, endFrame: 20 }],
        },
      },
    });
    await mounted.seek(11);
    expect(element.textContent).toBe("");
    await mounted.seek(12);
    expect(shownTexts(element)).toEqual(["Later"]);
  });

  it("orders word timings by start frame when the asset lists them out of order", async () => {
    const { element, mounted } = await mountKitScene({
      name: "caption-words",
      durationFrames: 40,
      props: { assetId: "shuffled" },
      assets: {
        shuffled: { ...speech, words: speech.words.toReversed() },
      },
    });
    await mounted.seek(10);
    expect(shownTexts(element).join(" ")).toBe("Every frame");
    await mounted.seek(39);
    expect(shownTexts(element).join(" ")).toBe("Every frame stays editable.");
  });
});
