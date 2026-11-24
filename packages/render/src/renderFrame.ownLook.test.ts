import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { renderPackageDirectory } from "./packagePaths.js";
import { decodePng } from "./testing/decodePng.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "./testing/renderProject.js";
import { valueOf } from "./testing/valueOf.js";

const appColors = {
  background: "#0c0c0d",
  text: "#ecebe8",
  muted: "#908f8b",
  accent: "#d9c9a8",
};
const appGround: [number, number, number] = [12, 12, 13];

const lookBackgroundCode = `import { defineReactScene } from "@yumekit/scene";
import { useStylePack } from "@yumekit/scene-kit";

export default defineReactScene(() => {
  const stylePack = useStylePack();
  return <div style={{ position: "absolute", inset: 0, background: stylePack.colors.background }} />;
});
`;

const linesScene: Edit = {
  kind: "putScene",
  scene: {
    id: "lines",
    title: "Lines",
    notes: "",
    source: {
      kind: "kit",
      component: "lines",
      props: { lines: ["An idea.", "A finished video."] },
    },
  },
};

const scenesEdits: Edit[] = [
  linesScene,
  moduleScene({ sceneId: "custom", code: lookBackgroundCode }),
  sceneTracks({
    tracks: [
      [
        { id: "kit", sceneId: "lines", startFrame: 0, durationFrames: 60 },
        { id: "own", sceneId: "custom", startFrame: 60, durationFrames: 30 },
      ],
    ],
  }),
];

async function fontEdits(folder: string): Promise<Edit[]> {
  await mkdir(join(folder, "assets", "files"), { recursive: true });
  await copyFile(
    join(
      renderPackageDirectory,
      "..",
      "scene-kit",
      "fonts",
      "Fraunces-SemiBold-latin.woff2",
    ),
    join(folder, "assets", "files", "brand.woff2"),
  );
  return [
    {
      kind: "addAsset",
      asset: {
        id: "brand",
        kind: "font",
        file: "assets/files/brand.woff2",
        source: { kind: "import", originalName: "brand.woff2" },
      },
    },
    { kind: "setFonts", fonts: [{ assetId: "brand", family: "Brand" }] },
  ];
}

async function pictureOf(options: { folder: string; frame: number }) {
  const rendered = valueOf(await renderFrame({ ...options, outputId: "wide" }));
  return { png: rendered.png, picture: await decodePng(rendered.png) };
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

describe("renderFrame with the own colors and font of the project", () => {
  it("draws a kit scene and a custom scene that reads useStylePack on the own background", async () => {
    const folder = await createRenderProject({
      edits: [
        ...scenesEdits,
        { kind: "setLook", look: "midnight", colors: appColors },
      ],
    });

    const kit = await pictureOf({ folder, frame: 50 });
    const custom = await pictureOf({ folder, frame: 75 });

    const corner = { x: 2, y: kit.picture.heightPixels - 3 };
    expect(
      isNear({ actual: kit.picture.pixelAt(corner), expected: appGround }),
    ).toBe(true);
    expect(
      isNear({ actual: custom.picture.pixelAt(corner), expected: appGround }),
    ).toBe(true);
  });

  it("draws the text of a kit scene in the look font of the project", async () => {
    const withLookFont = await createRenderProject({
      edits: async (store) => [
        ...scenesEdits,
        ...(await fontEdits(store.folder)),
        { kind: "setLook", look: "midnight", font: "Brand" },
      ],
    });
    const withoutLookFont = await createRenderProject({
      edits: async (store) => [
        ...scenesEdits,
        ...(await fontEdits(store.folder)),
        { kind: "setLook", look: "midnight" },
      ],
    });

    const own = await pictureOf({ folder: withLookFont, frame: 50 });
    const usual = await pictureOf({ folder: withoutLookFont, frame: 50 });

    expect(Buffer.from(own.png).equals(usual.png)).toBe(false);
  });
});
