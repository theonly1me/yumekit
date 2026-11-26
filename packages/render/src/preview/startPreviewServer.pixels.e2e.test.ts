import { join } from "node:path";
import type { Edit } from "@yumekit/project";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { renderFrame } from "../index.js";
import {
  openPreview,
  pixelDifferenceOf,
  type OpenPreview,
} from "../testing/openPreview.js";
import {
  createRenderProject,
  folderOfTheFile,
  moduleScene,
  sceneTracks,
  type FolderOfTheFile,
} from "../testing/renderProject.js";
import { movingSquareCode } from "../testing/sceneCodes.js";
import { addVideoAsset, movingMarkerVideo } from "../testing/testVideo.js";
import { valueOf } from "../testing/valueOf.js";
import { videoClipScene } from "../testing/videoProject.js";

const titleScene: Edit = {
  kind: "putScene",
  scene: {
    id: "title",
    title: "Title",
    notes: "",
    source: {
      kind: "kit",
      component: "title-card",
      props: { heading: "Preview title" },
    },
  },
};

const sceneFrames = [
  { sceneKind: "a kit scene", frame: 4 },
  { sceneKind: "a custom scene", frame: 45 },
  { sceneKind: "a video-clip scene", frame: 70 },
];

let folder = "";
let preview: OpenPreview | undefined;
let files: FolderOfTheFile | undefined;

beforeAll(async () => {
  files = await folderOfTheFile();
  folder = await createRenderProject({
    projectFolder: join(files.folder, "project"),
    edits: async (store) => [
      await addVideoAsset({
        folder: store.folder,
        assetId: "clip",
        video: movingMarkerVideo,
      }),
      titleScene,
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      videoClipScene({ assetId: "clip" }),
      sceneTracks({
        tracks: [
          [
            { id: "one", sceneId: "title", startFrame: 0, durationFrames: 30 },
            {
              id: "two",
              sceneId: "square",
              startFrame: 30,
              durationFrames: 30,
            },
            {
              id: "three",
              sceneId: "shot",
              startFrame: 60,
              durationFrames: 30,
            },
          ],
        ],
      }),
    ],
  });
  preview = await openPreview({ folder });
  await preview.parent.waitForReply((reply) => reply.type === "ready");
}, 60_000);

afterAll(async () => {
  await preview?.close();
  await files?.remove();
});

describe("the preview page pixels", () => {
  it.each(sceneFrames)(
    "draws the same pixels as renderFrame for $sceneKind",
    async ({ frame }) => {
      if (preview === undefined) {
        throw new Error("The preview did not open");
      }
      const reply = await preview.seek({ frame, requestId: frame });
      const shown = await preview.parent.screenshot();
      const rendered = valueOf(
        await renderFrame({ folder, outputId: "wide", frame }),
      );

      expect(reply).toEqual({ type: "sought", requestId: frame });
      expect(
        await pixelDifferenceOf({ actual: shown, expected: rendered.png }),
      ).toEqual({ differentPixels: 0, largestChannelDifference: 0 });
    },
    60_000,
  );
});
