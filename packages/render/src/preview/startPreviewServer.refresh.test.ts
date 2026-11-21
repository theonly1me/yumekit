import { openProject } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame } from "../index.js";
import { decodePng } from "../testing/decodePng.js";
import { openPreview, pixelDifferenceOf } from "../testing/openPreview.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { movingSquareCode, solidColorCode } from "../testing/sceneCodes.js";
import { valueOf } from "../testing/valueOf.js";

async function changeScene(folder: string): Promise<void> {
  const opened = await openProject({ folder });
  if (!opened.ok) {
    throw new Error(opened.failure.message);
  }
  const applied = await opened.value.applyEdits([
    moduleScene({
      sceneId: "square",
      code: solidColorCode,
      props: { color: "#00ff00" },
    }),
  ]);
  if (!applied.ok) {
    throw new Error(applied.failure.message);
  }
}

describe("refresh of the preview server", () => {
  it("draws the new project at the same frame after an edit and refresh", async () => {
    const folder = await createRenderProject({
      edits: [
        moduleScene({ sceneId: "square", code: movingSquareCode }),
        sceneTracks({
          tracks: [
            [
              {
                id: "one",
                sceneId: "square",
                startFrame: 0,
                durationFrames: 10,
              },
            ],
          ],
        }),
      ],
    });
    const preview = await openPreview({ folder });
    try {
      await preview.parent.waitForReply((reply) => reply.type === "ready");
      await preview.seek({ frame: 6, requestId: 1 });
      const before = await decodePng(await preview.parent.screenshot());
      await changeScene(folder);
      preview.parent.replies.length = 0;
      await preview.server.refresh();
      const ready = await preview.parent.waitForReply(
        (reply) => reply.type === "ready",
      );
      const shown = await preview.parent.screenshot();
      const rendered = valueOf(
        await renderFrame({ folder, outputId: "wide", frame: 6 }),
      );

      expect(before.pixelAt({ x: 80, y: 90 })).toEqual([255, 0, 0]);
      expect(ready).toEqual({ type: "ready", frameCount: 10 });
      expect(preview.parent.replies).toHaveLength(1);
      expect((await decodePng(shown)).pixelAt({ x: 80, y: 90 })).toEqual([
        0, 255, 0,
      ]);
      expect(
        await pixelDifferenceOf({ actual: shown, expected: rendered.png }),
      ).toEqual({ differentPixels: 0, largestChannelDifference: 0 });
    } finally {
      await preview.close();
    }
  }, 60_000);
});
