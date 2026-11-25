import type { Edit, JsonObject } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { decodePng, type DecodedPicture } from "./testing/decodePng.js";
import { createRenderProject, sceneTracks } from "./testing/renderProject.js";
import { valueOf } from "./testing/valueOf.js";

const framesPerBeat = 15;
const lookBackground: [number, number, number] = [16, 24, 32];
const flashWhite: [number, number, number] = [242, 238, 230];

function cardScene(options: { id: string; props: JsonObject }): Edit {
  return {
    kind: "putScene",
    scene: {
      id: options.id,
      title: options.id,
      notes: "",
      source: { kind: "kit", component: "trailer-card", props: options.props },
    },
  };
}

function isNear(options: {
  actual: [number, number, number];
  expected: [number, number, number];
}): boolean {
  return options.actual.every(
    (...[channel, index]) =>
      Math.abs(channel - (options.expected[index] ?? 0)) <= 4,
  );
}

function countPixels(options: {
  picture: DecodedPicture;
  matches: (pixel: [number, number, number]) => boolean;
}): number {
  let count = 0;
  for (let y = 0; y < options.picture.heightPixels; y += 1) {
    for (let x = 0; x < options.picture.widthPixels; x += 1) {
      count += options.matches(options.picture.pixelAt({ x, y })) ? 1 : 0;
    }
  }
  return count;
}

const isRed = ([red, green, blue]: [number, number, number]) =>
  red > 120 && green < 70 && blue < 70;

const isLit = ([red, green, blue]: [number, number, number]) =>
  red + green + blue > 30;

async function pictureAt(options: { folder: string; frame: number }) {
  return decodePng(
    valueOf(
      await renderFrame({
        folder: options.folder,
        outputId: "wide",
        frame: options.frame,
      }),
    ).png,
  );
}

describe("renderFrame with the trailer card", () => {
  it("stays black before its beat, flashes on it, shows the words, and cuts to black after the hold", async () => {
    const folder = await createRenderProject({
      edits: [
        { kind: "setTempo", tempo: 120 },
        cardScene({
          id: "card",
          props: {
            lines: ["Tonight it rang"],
            landsOnBeat: 1,
            holdSeconds: 1,
            flash: true,
            color: "#e02020",
          },
        }),
        sceneTracks({
          tracks: [
            [
              {
                id: "clip",
                sceneId: "card",
                startFrame: 0,
                durationFrames: 60,
              },
            ],
          ],
        }),
      ],
    });

    const before = await pictureAt({ folder, frame: framesPerBeat - 5 });
    const flash = await pictureAt({ folder, frame: framesPerBeat });
    const words = await pictureAt({ folder, frame: framesPerBeat + 10 });
    const after = await pictureAt({ folder, frame: framesPerBeat + 31 });

    expect(countPixels({ picture: before, matches: isLit })).toBe(0);
    expect(
      isNear({ actual: flash.pixelAt({ x: 4, y: 4 }), expected: flashWhite }),
    ).toBe(true);
    expect(countPixels({ picture: words, matches: isRed })).toBeGreaterThan(40);
    expect(words.pixelAt({ x: 4, y: 4 })).toEqual([0, 0, 0]);
    expect(countPixels({ picture: after, matches: isLit })).toBe(0);
  });

  it("draws the title variant on the own background of the look in the text color of the look", async () => {
    const folder = await createRenderProject({
      edits: [
        {
          kind: "setLook",
          look: "midnight",
          colors: {
            background: "#101820",
            text: "#f0c040",
            muted: "#8090a0",
            accent: "#40c0f0",
          },
        },
        cardScene({
          id: "title",
          props: { lines: ["The Bell"], variant: "title", background: "look" },
        }),
        sceneTracks({
          tracks: [
            [
              {
                id: "clip",
                sceneId: "title",
                startFrame: 0,
                durationFrames: 30,
              },
            ],
          ],
        }),
      ],
    });

    const picture = await pictureAt({ folder, frame: 29 });
    const isGold = ([red, green, blue]: [number, number, number]) =>
      red > 180 && green > 130 && blue < 110;

    expect(
      isNear({
        actual: picture.pixelAt({ x: 4, y: 4 }),
        expected: lookBackground,
      }),
    ).toBe(true);
    expect(countPixels({ picture, matches: isGold })).toBeGreaterThan(150);
  });
});
