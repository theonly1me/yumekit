import { defineReactScene } from "@yumekit/scene";
import { describe, expect, it, onTestFinished } from "vitest";
import {
  activateLook,
  kitScenes,
  kitScenesOf,
  loadStylePackFonts,
  paper,
  stylePackOf,
  useStylePack,
} from "../index.js";
import { mountKitScene } from "../testing/mountKitScene.js";

function loadedFaces(): string[] {
  return [...document.fonts]
    .filter((face) => face.status === "loaded")
    .map((face) => `${face.family} ${face.weight}`);
}

describe("looks", () => {
  it("paints a kit scene with the background, the text color, and the fonts of its look", async () => {
    const { element, mounted } = await mountKitScene({
      name: "title-card",
      look: "midnight",
      durationFrames: 1,
      props: { heading: "Night" },
    });
    await mounted.seek(0);

    const root = element.firstElementChild;
    const heading = element.querySelector("h1");
    expect(root === null ? "" : getComputedStyle(root).backgroundColor).toBe(
      "rgb(11, 13, 26)",
    );
    expect(heading === null ? "" : getComputedStyle(heading).color).toBe(
      "rgb(244, 242, 255)",
    );
    expect(loadedFaces()).toEqual(
      expect.arrayContaining(["Bricolage Grotesque 700", "Inter 500"]),
    );
  });

  it("loads the bundled fonts of each look", async () => {
    for (const look of ["studio", "editorial", "neon"]) {
      await loadStylePackFonts(stylePackOf(look));
    }

    expect(loadedFaces()).toEqual(
      expect.arrayContaining([
        "Inter Tight 800",
        "Inter 500",
        "Fraunces 600",
        "DM Sans 500",
        "Space Grotesk 700",
        "Space Grotesk 500",
      ]),
    );
  });

  it("keeps paper as the look of kitScenes and of an unknown look", () => {
    expect(kitScenesOf("paper")).toBe(kitScenes);
    expect(kitScenesOf("not-a-look")).toBe(kitScenes);
    expect(stylePackOf("not-a-look")).toBe(paper);
  });

  it("gives a scene outside the kit the pack of the look that the page activates", async () => {
    activateLook("neon");
    onTestFinished(() => {
      activateLook("paper");
    });
    const customScene = defineReactScene(() => {
      const stylePack = useStylePack();
      return (
        <p style={{ color: stylePack.colors.text }}>
          {stylePack.fonts.display.family}
        </p>
      );
    });
    const element = document.createElement("div");
    document.body.append(element);
    const mounted = await customScene.mount({
      element,
      output: { id: "wide", widthPixels: 320, heightPixels: 180 },
      framesPerSecond: 30,
      durationFrames: 1,
      props: {},
      findAsset: () => undefined,
    });
    await mounted.seek(0);

    const text = element.querySelector("p");
    expect(text?.textContent).toBe("Space Grotesk");
    expect(text === null ? "" : getComputedStyle(text).color).toBe(
      "rgb(245, 245, 245)",
    );
    mounted.dispose();
  });
});
