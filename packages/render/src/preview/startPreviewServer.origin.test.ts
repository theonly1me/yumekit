import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { openPreview } from "../testing/openPreview.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { solidColorCode } from "../testing/sceneCodes.js";

const quietMilliseconds = 500;

function solidProject(): Promise<string> {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "solid", code: solidColorCode }),
      sceneTracks({
        tracks: [
          [{ id: "one", sceneId: "solid", startFrame: 0, durationFrames: 10 }],
        ],
      }),
    ],
  });
}

describe("the origin checks of the preview page", () => {
  it("ignores a seek from another origin and answers the parent", async () => {
    const preview = await openPreview({ folder: await solidProject() });
    try {
      await preview.parent.waitForReply((reply) => reply.type === "ready");
      await preview.parent.sendFromOtherOrigin({
        type: "seek",
        frame: 2,
        requestId: 7,
      });
      const answered = await preview.seek({ frame: 3, requestId: 8 });
      await delay(quietMilliseconds);

      expect(answered).toEqual({ type: "sought", requestId: 8 });
      expect(
        preview.parent.replies.filter((reply) => reply.requestId === 7),
      ).toEqual([]);
    } finally {
      await preview.close();
    }
  }, 60_000);

  it.each(["http://127.0.0.1:1", "*", "not an origin"])(
    "accepts and sends no message when the permitted origin is %s",
    async (permittedOrigin) => {
      const preview = await openPreview({
        folder: await solidProject(),
        permittedOrigin,
      });
      try {
        await preview.parent
          .previewFrame()
          .waitForFunction(
            () =>
              (document.querySelector("#stage")?.childElementCount ?? 0) > 0,
          );
        await preview.parent.send({ type: "seek", frame: 2, requestId: 9 });
        await delay(quietMilliseconds);

        expect(preview.parent.replies).toEqual([]);
      } finally {
        await preview.close();
      }
    },
    60_000,
  );
});
