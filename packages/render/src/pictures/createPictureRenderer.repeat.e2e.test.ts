import type { Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import {
  createPictureRenderer,
  renderFrame,
  renderSceneFrame,
} from "../index.js";
import { movingSquareCode } from "../testing/sceneCodes.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { valueOf } from "../testing/valueOf.js";

const titleScene: Edit = {
  kind: "putScene",
  scene: {
    id: "title",
    title: "Title",
    notes: "",
    source: {
      kind: "kit",
      component: "title-card",
      props: { heading: "Kept page" },
    },
  },
};

function mixedProject() {
  return createRenderProject({
    edits: [
      titleScene,
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      { kind: "setLook", look: "midnight" },
      sceneTracks({
        tracks: [
          [
            {
              id: "title",
              sceneId: "title",
              startFrame: 0,
              durationFrames: 30,
            },
            {
              id: "square",
              sceneId: "square",
              startFrame: 30,
              durationFrames: 30,
            },
          ],
        ],
      }),
    ],
  });
}

function isSame(options: { kept: Uint8Array | undefined; fresh: Uint8Array }) {
  return (
    options.kept !== undefined &&
    Buffer.from(options.kept).equals(options.fresh)
  );
}

describe("the repeat check of a kept page", () => {
  it("gives the bytes of a new page for a kit scene and a custom scene", async () => {
    const folder = await mixedProject();
    const pictures = createPictureRenderer({ folder });
    valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [50, 3, 44] }),
    );
    valueOf(
      await pictures.renderSceneFrames({
        outputId: "wide",
        sceneIds: ["square", "title"],
        durationFrames: 90,
        frame: 68,
      }),
    );
    const kept = valueOf(
      await pictures.renderFrames({ outputId: "wide", frames: [20, 40] }),
    );
    const keptAlone = valueOf(
      await pictures.renderSceneFrames({
        outputId: "wide",
        sceneIds: ["title", "square"],
        durationFrames: 90,
        frame: 10,
      }),
    );
    await pictures.close();

    const fresh = await Promise.all(
      [20, 40].map(
        async (frame) =>
          valueOf(await renderFrame({ folder, outputId: "wide", frame })).png,
      ),
    );
    const freshAlone = await Promise.all(
      ["title", "square"].map(
        async (sceneId) =>
          valueOf(
            await renderSceneFrame({
              folder,
              outputId: "wide",
              sceneId,
              durationFrames: 90,
              frame: 10,
            }),
          ).png,
      ),
    );
    expect(
      [...kept, ...keptAlone].map((...[picture, index]) =>
        isSame({
          kept: picture.png,
          fresh: [...fresh, ...freshAlone][index] ?? new Uint8Array(),
        }),
      ),
    ).toEqual([true, true, true, true]);
  });

  it("names a scene that the project does not have", async () => {
    const pictures = createPictureRenderer({ folder: await mixedProject() });
    const missing = await pictures.renderSceneFrames({
      outputId: "wide",
      sceneIds: ["title", "nowhere"],
      durationFrames: 90,
      frame: 10,
    });
    await pictures.close();

    expect(missing).toMatchObject({
      ok: false,
      failure: { kind: "scene-not-found", sceneId: "nowhere" },
    });
  });
});
