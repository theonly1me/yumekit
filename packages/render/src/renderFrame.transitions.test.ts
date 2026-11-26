import { join } from "node:path";
import type { SceneTransition } from "@yumekit/project";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { decodePng } from "./testing/decodePng.js";
import {
  openPreview,
  pixelDifferenceOf,
  type OpenPreview,
} from "./testing/openPreview.js";
import {
  createRenderProject,
  folderOfTheFile,
  moduleScene,
  sceneTracks,
  type FolderOfTheFile,
} from "./testing/renderProject.js";
import { solidColorCode } from "./testing/sceneCodes.js";
import { valueOf } from "./testing/valueOf.js";

function redThenBlue(options: {
  transition: SceneTransition | undefined;
  projectFolder: string;
}) {
  const { transition } = options;
  return createRenderProject({
    projectFolder: options.projectFolder,
    edits: [
      moduleScene({
        sceneId: "red",
        code: solidColorCode,
        props: { color: "#ff0000" },
      }),
      moduleScene({
        sceneId: "blue",
        code: solidColorCode,
        props: { color: "#0000ff" },
      }),
      sceneTracks({
        tracks: [
          [
            { id: "one", sceneId: "red", startFrame: 0, durationFrames: 30 },
            {
              id: "two",
              sceneId: "blue",
              startFrame: 30,
              durationFrames: 30,
              ...(transition === undefined ? {} : { transition }),
            },
          ],
        ],
      }),
    ],
  });
}

async function pictureAt(options: { folder: string; frame: number }) {
  return valueOf(await renderFrame({ ...options, outputId: "wide" })).png;
}

let fadeFolder = "";
let cutFolder = "";
let preview: OpenPreview | undefined;
let files: FolderOfTheFile | undefined;

beforeAll(async () => {
  files = await folderOfTheFile();
  const { folder } = files;
  [fadeFolder, cutFolder] = await Promise.all([
    redThenBlue({
      transition: { kind: "fade", durationFrames: 10 },
      projectFolder: join(folder, "fade"),
    }),
    redThenBlue({ transition: undefined, projectFolder: join(folder, "cut") }),
  ]);
  preview = await openPreview({ folder: fadeFolder });
  await preview.parent.waitForReply((reply) => reply.type === "ready");
}, 60_000);

afterAll(async () => {
  await preview?.close();
  await files?.remove();
});

describe("renderFrame with a transition", () => {
  it("holds pixels of both scenes in a frame in the middle of a fade", async () => {
    const picture = await decodePng(
      await pictureAt({ folder: fadeFolder, frame: 34 }),
    );
    const [red, green, blue] = picture.pixelAt({ x: 160, y: 90 });
    expect(red).toBeGreaterThan(60);
    expect(blue).toBeGreaterThan(60);
    expect(green).toBeLessThan(10);
  }, 60_000);

  it.each([29, 40])(
    "draws frame %i, outside the fade, with the pixels of a cut",
    async (frame) => {
      const [withFade, withCut] = await Promise.all([
        pictureAt({ folder: fadeFolder, frame }),
        pictureAt({ folder: cutFolder, frame }),
      ]);
      expect(Buffer.from(withFade).equals(Buffer.from(withCut))).toBe(true);
    },
    60_000,
  );

  it("draws the same pixels in the preview page and in renderFrame in the middle of a fade", async () => {
    if (preview === undefined) throw new Error("The preview did not open");
    const reply = await preview.seek({ frame: 34, requestId: 34 });
    const shown = await preview.parent.screenshot();
    const rendered = await pictureAt({ folder: fadeFolder, frame: 34 });
    expect(reply).toEqual({ type: "sought", requestId: 34 });
    expect(
      await pixelDifferenceOf({ actual: shown, expected: rendered }),
    ).toEqual({ differentPixels: 0, largestChannelDifference: 0 });
  }, 60_000);
});
