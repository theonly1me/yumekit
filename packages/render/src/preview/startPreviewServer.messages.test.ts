import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decodePng } from "../testing/decodePng.js";
import { openPreview, type OpenPreview } from "../testing/openPreview.js";
import {
  createRenderProject,
  folderOfTheFile,
  moduleScene,
  sceneTracks,
  type FolderOfTheFile,
} from "../testing/renderProject.js";
import { solidColorCode, throwingCode } from "../testing/sceneCodes.js";

let preview: OpenPreview | undefined;
let files: FolderOfTheFile | undefined;

function openedPreview(): OpenPreview {
  if (preview === undefined) {
    throw new Error("The preview did not open");
  }
  return preview;
}

beforeAll(async () => {
  files = await folderOfTheFile();
  const folder = await createRenderProject({
    projectFolder: join(files.folder, "project"),
    edits: [
      moduleScene({ sceneId: "solid", code: solidColorCode }),
      moduleScene({ sceneId: "broken", code: throwingCode }),
      sceneTracks({
        tracks: [
          [
            { id: "one", sceneId: "solid", startFrame: 0, durationFrames: 10 },
            {
              id: "two",
              sceneId: "broken",
              startFrame: 10,
              durationFrames: 10,
            },
          ],
        ],
      }),
    ],
  });
  preview = await openPreview({ folder });
}, 60_000);

afterAll(async () => {
  await preview?.close();
  await files?.remove();
});

describe("the preview page messages", () => {
  it("sends ready with the frame count of the output", async () => {
    const ready = await openedPreview().parent.waitForReply(
      (reply) => reply.type === "ready",
    );

    expect(ready).toEqual({ type: "ready", frameCount: 20 });
  });

  it("answers one seek with one sought message of the same requestId", async () => {
    const { parent, seek } = openedPreview();
    const reply = await seek({ frame: 3, requestId: 41 });
    await seek({ frame: 4, requestId: 42 });

    expect(reply).toEqual({ type: "sought", requestId: 41 });
    expect(
      parent.replies.filter((candidate) => candidate.requestId === 41),
    ).toHaveLength(1);
  });

  it("sends failed with the scene id when a scene throws, and the next seek still draws", async () => {
    const { parent, seek } = openedPreview();
    const failed = await seek({ frame: 15, requestId: 51 });
    const next = await seek({ frame: 5, requestId: 52 });
    const picture = await decodePng(await parent.screenshot());

    expect(failed).toMatchObject({
      type: "failed",
      requestId: 51,
      kind: "scene-error",
      sceneId: "broken",
    });
    expect(next).toEqual({ type: "sought", requestId: 52 });
    expect(picture.pixelAt({ x: 160, y: 90 })).toEqual([0, 0, 255]);
  });

  it("sends failed with frame-out-of-range for a frame after the output", async () => {
    const reply = await openedPreview().seek({ frame: 20, requestId: 61 });

    expect(reply).toMatchObject({
      type: "failed",
      requestId: 61,
      kind: "frame-out-of-range",
    });
  });
});
