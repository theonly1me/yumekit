import { describe, expect, it } from "vitest";
import { createPictureRenderer, renderFrame } from "../index.js";
import {
  movingSquareCode,
  solidColorCode,
  throwingCode,
} from "../testing/sceneCodes.js";
import {
  changeProject,
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { failureOf, valueOf } from "../testing/valueOf.js";

function squareProject() {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      moduleScene({ sceneId: "broken", code: throwingCode }),
      sceneTracks({
        tracks: [
          [
            {
              id: "move",
              sceneId: "square",
              startFrame: 0,
              durationFrames: 30,
            },
            {
              id: "break",
              sceneId: "broken",
              startFrame: 30,
              durationFrames: 10,
            },
          ],
        ],
      }),
    ],
  });
}

async function newPagePicture(options: { folder: string; frame: number }) {
  return valueOf(
    await renderFrame({
      folder: options.folder,
      outputId: "wide",
      frame: options.frame,
    }),
  ).png;
}

describe("a kept browser for pictures", () => {
  it("shows the new project after a project change", async () => {
    const folder = await squareProject();
    const pictures = createPictureRenderer({ folder });
    const [before] = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [5] }),
    );
    await changeProject({
      folder,
      edits: [moduleScene({ sceneId: "square", code: solidColorCode })],
    });
    const [after] = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [5] }),
    );
    await pictures.close();

    expect(
      Buffer.from(after?.png ?? []).equals(before?.png ?? new Uint8Array()),
    ).toBe(false);
    expect(
      Buffer.from(after?.png ?? []).equals(
        await newPagePicture({ folder, frame: 5 }),
      ),
    ).toBe(true);
  });

  it("keeps the frames of two calls at the same time apart", async () => {
    const folder = await squareProject();
    const pictures = createPictureRenderer({ folder });
    const [early, late] = await Promise.all([
      pictures.renderFrames({ outputId: "wide", frames: [2, 4, 6] }),
      pictures.renderFrames({ outputId: "wide", frames: [20, 22, 24] }),
    ]);
    await pictures.close();

    const drawn = [...valueOf(early), ...valueOf(late)];
    const expected = await Promise.all(
      [2, 4, 6, 20, 22, 24].map((frame) => newPagePicture({ folder, frame })),
    );
    expect(
      drawn.map((...[picture, index]) =>
        Buffer.from(picture.png).equals(expected[index] ?? new Uint8Array()),
      ),
    ).toEqual([true, true, true, true, true, true]);
  });

  it("draws the next picture after a custom scene that throws", async () => {
    const folder = await squareProject();
    const pictures = createPictureRenderer({ folder });
    const broken = failureOf(
      await pictures.renderFrames({ outputId: "wide", frames: [35] }),
    );
    const [next] = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [12] }),
    );
    await pictures.close();

    expect(broken).toMatchObject({ kind: "scene-error", sceneId: "broken" });
    expect(
      Buffer.from(next?.png ?? []).equals(
        await newPagePicture({ folder, frame: 12 }),
      ),
    ).toBe(true);
  });
});
