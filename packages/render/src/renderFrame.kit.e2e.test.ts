import type { Edit, JsonObject } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { decodePng, type DecodedPicture } from "./testing/decodePng.js";
import { createRenderProject, sceneTracks } from "./testing/renderProject.js";
import { valueOf } from "./testing/valueOf.js";

const paper: [number, number, number] = [238, 241, 244];
const lamp: [number, number, number] = [242, 179, 61];
const clipFrames = 30;

const kitClips: { component: string; props: JsonObject }[] = [
  { component: "title-card", props: { heading: "Kit title" } },
  { component: "bullet-list", props: { items: ["One", "Two"] } },
  { component: "image-pan", props: { assetId: "missing" } },
  { component: "caption-words", props: { text: "Words appear" } },
  { component: "bar-chart", props: { bars: [{ label: "A", value: 3 }] } },
  { component: "quote", props: { quote: "A short line." } },
];

function kitScene(clip: { component: string; props: JsonObject }): Edit {
  return {
    kind: "putScene",
    scene: {
      id: clip.component,
      title: clip.component,
      notes: "",
      source: { kind: "kit", component: clip.component, props: clip.props },
    },
  };
}

function isNear(options: {
  actual: [number, number, number];
  expected: [number, number, number];
}): boolean {
  return [...options.actual.entries()].every(
    ([index, channel]) =>
      Math.abs(channel - (options.expected[index] ?? 0)) <= 3,
  );
}

function darkPixelCount(picture: DecodedPicture): number {
  let count = 0;
  for (let y = 0; y < picture.heightPixels; y += 1) {
    for (let x = 0; x < picture.widthPixels; x += 1) {
      const [red, green, blue] = picture.pixelAt({ x, y });
      count += red + green + blue < 200 ? 1 : 0;
    }
  }
  return count;
}

async function lastFrameOf(clip: {
  component: string;
  props: JsonObject;
}): Promise<DecodedPicture> {
  const folder = await createRenderProject({
    edits: [
      kitScene(clip),
      sceneTracks({
        tracks: [
          [
            {
              id: `clip-${clip.component}`,
              sceneId: clip.component,
              startFrame: 0,
              durationFrames: clipFrames,
            },
          ],
        ],
      }),
    ],
  });
  const rendered = valueOf(
    await renderFrame({ folder, outputId: "wide", frame: clipFrames - 1 }),
  );
  return decodePng(rendered.png);
}

describe("renderFrame with kit scenes", () => {
  it.each(kitClips)(
    "renders the last frame of the $component kit scene",
    async (clip) => {
      const picture = await lastFrameOf(clip);

      expect(picture.widthPixels).toBe(320);
      expect(picture.heightPixels).toBe(180);
    },
  );

  it("draws the title card on paper with ink and the accent", async () => {
    const titleCard = await lastFrameOf({
      component: "title-card",
      props: { heading: "Kit title" },
    });

    expect(
      isNear({ actual: titleCard.pixelAt({ x: 2, y: 177 }), expected: paper }),
    ).toBe(true);
    expect(
      isNear({ actual: titleCard.pixelAt({ x: 316, y: 2 }), expected: lamp }),
    ).toBe(true);
    expect(darkPixelCount(titleCard)).toBeGreaterThan(50);
  });
});
