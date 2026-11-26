import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderFrame, renderVideo } from "./index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import { solidColorCode } from "./testing/sceneCodes.js";
import { addToneAsset } from "./testing/toneWav.js";
import { failureOf } from "./testing/valueOf.js";

const shortClip = {
  id: "show",
  sceneId: "solid",
  startFrame: 0,
  durationFrames: 30,
};

function solidProject() {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "solid", code: solidColorCode }),
      sceneTracks({ tracks: [[shortClip]] }),
    ],
  });
}

describe("render failures before the browser starts", () => {
  it("returns project-invalid with the open failure", async () => {
    const folder = join(await temporaryFolder(), "missing");
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 0 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "project-invalid",
        openFailure: { kind: "folder-not-found" },
      },
    });
  });

  it("returns output-not-found with the output id", async () => {
    const folder = await solidProject();
    await expect(
      renderFrame({ folder, outputId: "tall", frame: 0 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "output-not-found", outputId: "tall" },
    });
  });

  it("returns frame-out-of-range for a frame and for a range past the end", async () => {
    const folder = await solidProject();
    await expect(
      renderFrame({ folder, outputId: "wide", frame: 30 }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "frame-out-of-range", frame: 30, frameCount: 30 },
    });
    const destination = join(await temporaryFolder(), "range.mp4");
    await expect(
      renderVideo({
        folder,
        outputId: "wide",
        destination,
        firstFrame: 20,
        frameCount: 20,
      }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "frame-out-of-range", frame: 39, frameCount: 30 },
    });
  });

  it("returns ffmpeg-not-found with an install hint", async () => {
    const folder = await solidProject();
    vi.stubEnv("PATH", "/yumekit-no-ffmpeg");
    const destination = join(await temporaryFolder(), "none.mp4");
    const rendered = await renderVideo({
      folder,
      outputId: "wide",
      destination,
    });
    vi.unstubAllEnvs();
    const failure = failureOf(rendered);
    expect(failure.kind).toBe("ffmpeg-not-found");
    expect(failure.hint).toContain("brew install ffmpeg");
  });

  it("returns encode-failed with the end of the FFmpeg log", async () => {
    const folder = await createRenderProject({
      edits: async (store) => [
        moduleScene({ sceneId: "solid", code: solidColorCode }),
        await addToneAsset({
          folder: store.folder,
          assetId: "broken",
          durationFrames: 30,
          content: Buffer.from("this is not audio"),
        }),
        sceneTracks({
          tracks: [[shortClip]],
          audioClips: [
            {
              id: "noise",
              assetId: "broken",
              startFrame: 0,
              durationFrames: 30,
              assetStartFrame: 0,
              gainDecibels: 0,
            },
          ],
        }),
      ],
    });
    const destination = join(await temporaryFolder(), "broken.mp4");
    const rendered = await renderVideo({
      folder,
      outputId: "wide",
      destination,
      scale: 0.5,
    });
    const failure = failureOf(rendered);
    expect(failure.kind === "encode-failed" && failure.stderrTail).toContain(
      "broken.wav",
    );
  });
});
