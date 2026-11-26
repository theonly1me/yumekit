import type { Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { decodePng } from "./testing/decodePng.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "./testing/renderProject.js";
import { valueOf } from "./testing/valueOf.js";

const neonBlack: [number, number, number] = [5, 5, 5];
const paper: [number, number, number] = [238, 241, 244];

const lookBackgroundCode = `import { defineReactScene } from "@yumekit/scene";
import { useStylePack } from "@yumekit/scene-kit";

export default defineReactScene(() => {
  const stylePack = useStylePack();
  return <div style={{ position: "absolute", inset: 0, background: stylePack.colors.background }} />;
});
`;

const titleScene: Edit = {
  kind: "putScene",
  scene: {
    id: "title",
    title: "Title",
    notes: "",
    source: {
      kind: "kit",
      component: "title-card",
      props: { heading: "A look" },
    },
  },
};

const scenesEdits: Edit[] = [
  titleScene,
  moduleScene({ sceneId: "custom", code: lookBackgroundCode }),
  sceneTracks({
    tracks: [
      [
        { id: "kit", sceneId: "title", startFrame: 0, durationFrames: 30 },
        { id: "own", sceneId: "custom", startFrame: 30, durationFrames: 30 },
      ],
    ],
  }),
];

async function cornerPixel(options: { folder: string; frame: number }) {
  const rendered = valueOf(await renderFrame({ ...options, outputId: "wide" }));
  const picture = await decodePng(rendered.png);
  return picture.pixelAt({ x: 2, y: picture.heightPixels - 3 });
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

describe("renderFrame with the look of the project", () => {
  it("draws kit scenes and custom scenes that read useStylePack in the look of the project", async () => {
    const folder = await createRenderProject({
      edits: [...scenesEdits, { kind: "setLook", look: "neon" }],
    });

    const kit = await cornerPixel({ folder, frame: 29 });
    const custom = await cornerPixel({ folder, frame: 45 });

    expect(isNear({ actual: kit, expected: neonBlack })).toBe(true);
    expect(isNear({ actual: custom, expected: neonBlack })).toBe(true);
  });

  it("draws a project with no look with the same pixels as a project with the paper look", async () => {
    const withNoLook = await createRenderProject({ edits: scenesEdits });
    const withPaper = await createRenderProject({
      edits: [...scenesEdits, { kind: "setLook", look: "paper" }],
    });

    const noLookPicture = valueOf(
      await renderFrame({ folder: withNoLook, outputId: "wide", frame: 29 }),
    );
    const paperPicture = valueOf(
      await renderFrame({ folder: withPaper, outputId: "wide", frame: 29 }),
    );

    expect(
      isNear({
        actual: await cornerPixel({ folder: withNoLook, frame: 45 }),
        expected: paper,
      }),
    ).toBe(true);
    expect(Buffer.from(noLookPicture.png).equals(paperPicture.png)).toBe(true);
  });
});
