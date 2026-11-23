import { describe, expect, it } from "vitest";
import { mountKitScene } from "../testing/mountKitScene.js";

const identityTransforms = new Set([
  "",
  "none",
  "translateY(0px)",
  "translateX(0px)",
  "scale(1)",
]);

function movedTransformsIn(element: HTMLElement): string[] {
  return [...element.querySelectorAll<HTMLElement>("*")]
    .filter((child) => child.closest("[data-backdrop]") === null)
    .map((child) => child.style.transform)
    .filter((transform) => !identityTransforms.has(transform));
}

const titleCard = {
  name: "title-card",
  props: { heading: "A calm start", subheading: "Soft" },
};

describe("calm kit scenes", () => {
  it("title-card comes in with a fade and no move when the video is calm", async () => {
    const { element, mounted } = await mountKitScene({
      ...titleCard,
      durationFrames: 90,
      calm: true,
    });

    await mounted.seek(8);

    expect(movedTransformsIn(element)).toEqual([]);
  });

  it("title-card moves during its entry when the video is not calm", async () => {
    const { element, mounted } = await mountKitScene({
      ...titleCard,
      durationFrames: 90,
    });

    await mounted.seek(8);

    expect(movedTransformsIn(element).length).toBeGreaterThan(0);
  });
});
