import { describe, expect, it } from "vitest";
import { createPictureRenderer, type ContactSheetRequest } from "../index.js";
import { pngSizeOf } from "../png.js";
import { decodePng } from "../testing/decodePng.js";
import { movingSquareCode, solidColorCode } from "../testing/sceneCodes.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { addVideoAsset, movingMarkerVideo } from "../testing/testVideo.js";
import { valueOf } from "../testing/valueOf.js";

const wideOutput = {
  id: "wide",
  label: "Wide",
  widthPixels: 1920,
  heightPixels: 1080,
};

const textOutsideCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => (
  <div style={{ position: "absolute", inset: 0, background: "#222222" }}>
    <h1 style={{ position: "absolute", left: -400, top: 100, fontSize: 120, whiteSpace: "nowrap" }}>Launch day</h1>
  </div>
));
`;

const stuckVideoCode = `import { defineReactScene, VideoFrame } from "@yumekit/scene";

export default defineReactScene(() => (
  <div style={{ position: "absolute", inset: 0 }}>
    <VideoFrame assetId="clip" assetFrame={0} />
  </div>
));
`;

async function sheetOf(options: {
  folder: string;
  request: ContactSheetRequest;
}) {
  const pictures = createPictureRenderer({ folder: options.folder });
  try {
    return valueOf(await pictures.renderContactSheet(options.request));
  } finally {
    await pictures.close();
  }
}

const everySecondOf30 = Array.from(
  { length: 30 },
  (...[, index]) => index * 30,
);

describe("a contact sheet", () => {
  it("draws 30 frames of a 30 second video as one picture of 5 columns and 6 rows", async () => {
    const folder = await createRenderProject({
      outputs: [wideOutput],
      edits: [
        moduleScene({
          sceneId: "square",
          code: movingSquareCode.replace(
            "left: frame * 10",
            "left: (frame * 10) % 1800",
          ),
        }),
        sceneTracks({
          tracks: [
            [
              {
                id: "move",
                sceneId: "square",
                startFrame: 0,
                durationFrames: 900,
              },
            ],
          ],
        }),
      ],
    });

    const sheet = await sheetOf({
      folder,
      request: { outputId: "wide", frames: everySecondOf30 },
    });

    expect(sheet.frames.map((frame) => frame.frame)).toEqual(everySecondOf30);
    expect(pngSizeOf(sheet.png)).toEqual({
      widthPixels: 1624,
      heightPixels: 1270,
    });
    expect(sheet.frames.every((frame) => frame.oneColor === undefined)).toBe(
      true,
    );
  });

  it("names the color of a frame that is one color, and marks its cell in red", async () => {
    const folder = await createRenderProject({
      outputs: [wideOutput],
      edits: [
        moduleScene({ sceneId: "square", code: movingSquareCode }),
        moduleScene({ sceneId: "blank", code: solidColorCode }),
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
                id: "blank",
                sceneId: "blank",
                startFrame: 30,
                durationFrames: 30,
              },
            ],
          ],
        }),
      ],
    });

    const sheet = await sheetOf({
      folder,
      request: { outputId: "wide", frames: [0, 45], columns: 2 },
    });
    const picture = await decodePng(sheet.png);

    expect(sheet.frames.map((frame) => frame.oneColor)).toEqual([
      undefined,
      "#0000ff",
    ]);
    expect(picture.pixelAt({ x: 4 + 320 + 4 + 1, y: 30 + 10 })).toEqual([
      255, 90, 95,
    ]);
  });

  it("names text that leaves the picture and a video that shows its first frame", async () => {
    const folder = await createRenderProject({
      outputs: [wideOutput],
      edits: async (store) => [
        await addVideoAsset({
          folder: store.folder,
          assetId: "clip",
          video: movingMarkerVideo,
        }),
        moduleScene({ sceneId: "title", code: textOutsideCode }),
        moduleScene({ sceneId: "stuck", code: stuckVideoCode }),
        sceneTracks({
          tracks: [
            [
              {
                id: "title",
                sceneId: "title",
                startFrame: 0,
                durationFrames: 10,
              },
              {
                id: "stuck",
                sceneId: "stuck",
                startFrame: 10,
                durationFrames: 20,
              },
            ],
          ],
        }),
      ],
    });

    const sheet = await sheetOf({
      folder,
      request: { outputId: "wide", frames: [5, 15] },
    });

    expect(sheet.frames).toMatchObject([
      { frame: 5, textOutside: ["Launch day"], firstFrameVideos: [] },
      { frame: 15, textOutside: [], firstFrameVideos: ["clip"] },
    ]);
  });
});
