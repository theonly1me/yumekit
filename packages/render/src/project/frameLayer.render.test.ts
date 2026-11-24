import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderFrame, renderVideo } from "../index.js";
import { decodePng } from "../testing/decodePng.js";
import { openPreview, pixelDifferenceOf } from "../testing/openPreview.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "../testing/renderProject.js";
import { solidColorCode } from "../testing/sceneCodes.js";
import { valueOf } from "../testing/valueOf.js";

const markCode = `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";
import { markColors } from "./marks";

type SceneSpan = { startFrame: number; durationFrames: number };

function isSceneSpan(value: unknown): value is SceneSpan {
  return typeof value === "object" && value !== null && "startFrame" in value && "durationFrames" in value;
}

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { durationFrames } = useSceneContext();
  const scenes = Array.isArray(props.scenes) ? props.scenes.filter(isSceneSpan) : [];
  const index = scenes.findIndex((scene) => frame >= scene.startFrame && frame < scene.startFrame + scene.durationFrames);
  const color = markColors[Math.max(0, index)] ?? "#000000";
  const width = Math.round((320 * (frame + 1)) / durationFrames);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: 40, height: 40, background: color }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width, background: "#ffffff" }} />
    </>
  );
});
`;

const marksCode = `export const markColors = ["#00ff00", "#ffff00"];
`;

function framedProject(): Promise<string> {
  return createRenderProject({
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
      { kind: "putSharedCode", name: "marks", code: marksCode },
      { kind: "putSharedCode", name: "frame", code: markCode },
      { kind: "setFrame", name: "frame" },
      sceneTracks({
        tracks: [
          [
            { id: "one", sceneId: "red", startFrame: 0, durationFrames: 30 },
            { id: "two", sceneId: "blue", startFrame: 30, durationFrames: 30 },
          ],
        ],
      }),
    ],
  });
}

async function pixelsAt(options: { folder: string; frame: number }) {
  const picture = await decodePng(
    valueOf(await renderFrame({ ...options, outputId: "wide" })).png,
  );
  return {
    mark: picture.pixelAt({ x: 10, y: 10 }),
    middle: picture.pixelAt({ x: 160, y: 90 }),
    barStart: picture.pixelAt({ x: 2, y: 175 }),
    barEnd: picture.pixelAt({ x: 300, y: 175 }),
  };
}

describe("the frame of a project", () => {
  it("draws once over the whole video, above each scene, with the current scene and the frame as its inputs", async () => {
    const folder = await framedProject();

    const early = await pixelsAt({ folder, frame: 5 });
    const late = await pixelsAt({ folder, frame: 59 });

    expect(early).toEqual({
      mark: [0, 255, 0],
      middle: [255, 0, 0],
      barStart: [255, 255, 255],
      barEnd: [255, 0, 0],
    });
    expect(late).toEqual({
      mark: [255, 255, 0],
      middle: [0, 0, 255],
      barStart: [255, 255, 255],
      barEnd: [255, 255, 255],
    });
  });

  it("passes the repeat check of a video render", async () => {
    const folder = await framedProject();
    const destination = join(await temporaryFolder(), "framed.mp4");

    const rendered = await renderVideo({
      folder,
      outputId: "wide",
      destination,
      scale: 0.5,
    });

    expect(rendered).toMatchObject({ ok: true, value: { frameCount: 60 } });
  });

  it("gives the same pixels in the preview as in a render", async () => {
    const folder = await framedProject();
    const preview = await openPreview({ folder });
    try {
      await preview.parent.waitForReply((reply) => reply.type === "ready");
      await preview.seek({ frame: 40, requestId: 1 });
      const shown = await preview.parent.screenshot();
      const rendered = valueOf(
        await renderFrame({ folder, outputId: "wide", frame: 40 }),
      );

      expect(
        await pixelDifferenceOf({ actual: shown, expected: rendered.png }),
      ).toEqual({ differentPixels: 0, largestChannelDifference: 0 });
    } finally {
      await preview.close();
    }
  }, 60_000);
});
