import { describe, expect, it } from "vitest";
import { assetLabelOf } from "./index.js";

describe("the name of an asset for a person", () => {
  it("uses the label when the asset has one", () => {
    expect(
      assetLabelOf({
        kind: "image",
        label: "Harbor at dawn",
        source: { kind: "tool", input: { prompt: "Something else" } },
      }),
    ).toBe("Harbor at dawn");
  });

  it("gives an old asset with no label the first six words of its prompt", () => {
    expect(
      assetLabelOf({
        kind: "image",
        source: {
          kind: "tool",
          input: { prompt: "a green tea cup on a table, soft morning light" },
        },
      }),
    ).toBe("A green tea cup on a...");
  });

  it("gives an old voice the first words of the text that it says", () => {
    expect(
      assetLabelOf({
        kind: "audio",
        source: { kind: "tool", input: { text: "Need a calm minute?" } },
      }),
    ).toBe("Need a calm minute");
  });

  it("gives a file of the person its original name", () => {
    expect(
      assetLabelOf({
        kind: "audio",
        source: { kind: "import", originalName: "my song.mp3" },
      }),
    ).toBe("my song.mp3");
  });

  it("gives an asset with no words a plain name of its kind", () => {
    expect(
      assetLabelOf({ kind: "video", source: { kind: "tool", input: {} } }),
    ).toBe("Video clip");
  });
});
