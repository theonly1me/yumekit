import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderVideo } from "./index.js";
import { streamSeconds } from "./testing/probe.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import { movingSquareCode } from "./testing/sceneCodes.js";
import { addToneAsset } from "./testing/toneWav.js";
import { valueOf } from "./testing/valueOf.js";

const outputFrames = 108;
const oneFrameSeconds = 1 / 30;

function narrationProject(): Promise<string> {
  return createRenderProject({
    edits: async (store) => [
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      await addToneAsset({
        folder: store.folder,
        assetId: "narration",
        durationFrames: outputFrames,
      }),
      sceneTracks({
        tracks: [
          [
            {
              id: "move",
              sceneId: "square",
              startFrame: 0,
              durationFrames: outputFrames,
            },
          ],
        ],
        audioClips: [
          {
            id: "voice",
            assetId: "narration",
            startFrame: 0,
            durationFrames: outputFrames,
            assetStartFrame: 0,
            gainDecibels: 0,
          },
        ],
      }),
    ],
  });
}

async function renderedSeconds(options: {
  firstFrame?: number;
  frameCount?: number;
}) {
  const folder = await narrationProject();
  const destination = join(await temporaryFolder(), "narration.mp4");
  valueOf(
    await renderVideo({
      folder,
      outputId: "wide",
      destination,
      scale: 0.25,
      ...options,
    }),
  );
  return streamSeconds(destination);
}

describe("renderVideo audio length", () => {
  it("keeps the audio of a narration that covers the whole output as long as the video", async () => {
    const seconds = await renderedSeconds({});

    expect(seconds.video).toBeCloseTo(outputFrames / 30, 5);
    expect(
      Math.abs((seconds.audio ?? 0) - (seconds.video ?? 0)),
    ).toBeLessThanOrEqual(oneFrameSeconds);
  });

  it("keeps the audio of a frame range as long as the video of the range", async () => {
    const seconds = await renderedSeconds({ firstFrame: 20, frameCount: 75 });

    expect(seconds.video).toBeCloseTo(75 / 30, 5);
    expect(
      Math.abs((seconds.audio ?? 0) - (seconds.video ?? 0)),
    ).toBeLessThanOrEqual(oneFrameSeconds);
  });
});
