import { describe, expect, it } from "vitest";
import { checkSceneCode, renderFrame } from "../index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { videoFrameCode } from "../testing/videoProject.js";

const videoElementCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => (
  <div style={{ position: "absolute", inset: 0 }}>
    <video src="/clip.mp4" muted />
  </div>
));
`;

const createdVideoCode = `import { createElement } from "react";
import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => createElement("video", { src: "/clip.mp4" }));
`;

describe("checkSceneCode and video", () => {
  it("rejects scene code with a <video> element and names VideoFrame", async () => {
    const result = await checkSceneCode({
      sceneId: "film",
      code: videoElementCode,
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        kind: "scene-compile-failed",
        sceneId: "film",
        line: 5,
        column: 5,
      },
    });
    expect(result.ok ? "" : result.failure.message).toContain("VideoFrame");
  });

  it("rejects scene code that creates a video element with createElement", async () => {
    const result = await checkSceneCode({
      sceneId: "film",
      code: createdVideoCode,
    });

    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", line: 4 },
    });
  });

  it("accepts scene code that draws a video asset with VideoFrame", async () => {
    await expect(
      checkSceneCode({ sceneId: "shot", code: videoFrameCode }),
    ).resolves.toEqual({ ok: true, value: { checked: true } });
  });

  it("refuses to render a stored scene with a <video> element", async () => {
    const folder = await createRenderProject({
      edits: [
        moduleScene({ sceneId: "film", code: videoElementCode }),
        sceneTracks({
          tracks: [
            [{ id: "film", sceneId: "film", startFrame: 0, durationFrames: 5 }],
          ],
        }),
      ],
    });

    await expect(
      renderFrame({ folder, outputId: "wide", frame: 0 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", sceneId: "film" },
    });
  });
});
