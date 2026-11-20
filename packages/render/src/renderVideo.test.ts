import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderVideo } from "./index.js";
import { decodeAudio, loudness, probeVideo } from "./testing/probe.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import { movingSquareCode } from "./testing/sceneCodes.js";
import { addToneAsset } from "./testing/toneWav.js";
import { valueOf } from "./testing/valueOf.js";

const squareClip = {
  id: "move",
  sceneId: "square",
  startFrame: 0,
  durationFrames: 90,
};

describe("renderVideo", () => {
  it("writes an H.264 video with the output size, frame count, and frame rate", async () => {
    const folder = await createRenderProject({
      edits: [
        moduleScene({ sceneId: "square", code: movingSquareCode }),
        sceneTracks({ tracks: [[squareClip]] }),
      ],
    });
    const destination = join(await temporaryFolder(), "square.mp4");
    const progress: number[] = [];
    const rendered = await renderVideo({
      folder,
      outputId: "wide",
      destination,
      firstFrame: 10,
      frameCount: 24,
      scale: 0.5,
      onProgress: ({ framesDone }) => progress.push(framesDone),
    });
    expect(rendered).toEqual({
      ok: true,
      value: {
        file: destination,
        frameCount: 24,
        durationSeconds: 0.8,
        widthPixels: 160,
        heightPixels: 90,
      },
    });
    expect(progress.at(-1)).toBe(24);
    expect(await probeVideo(destination)).toEqual([
      {
        codec_type: "video",
        codec_name: "h264",
        width: 160,
        height: 90,
        pix_fmt: "yuv420p",
        r_frame_rate: "30/1",
        nb_read_frames: "24",
      },
    ]);
  });

  it("mixes a tone that is silent before its clip and loud inside it", async () => {
    const folder = await createRenderProject({
      edits: async (store) => [
        moduleScene({ sceneId: "square", code: movingSquareCode }),
        await addToneAsset({
          folder: store.folder,
          assetId: "tone",
          durationFrames: 60,
        }),
        sceneTracks({
          tracks: [[squareClip]],
          audioClips: [
            {
              id: "beep",
              assetId: "tone",
              startFrame: 30,
              durationFrames: 30,
              assetStartFrame: 15,
              gainDecibels: -6,
            },
          ],
        }),
      ],
    });
    const destination = join(await temporaryFolder(), "tone.mp4");
    valueOf(
      await renderVideo({ folder, outputId: "wide", destination, scale: 0.5 }),
    );
    const streams = await probeVideo(destination);
    expect(streams.map((stream) => stream.codec_type)).toEqual([
      "video",
      "audio",
    ]);
    const audio = streams.find((stream) => stream.codec_type === "audio");
    expect(audio).toMatchObject({
      codec_name: "aac",
      sample_rate: "48000",
      channels: 2,
    });
    const samples = await decodeAudio(destination);
    const toneLoudness = (16_000 / Math.SQRT2) * 10 ** (-6 / 20);
    expect(
      loudness({ samples, fromSeconds: 0.1, toSeconds: 0.9 }),
    ).toBeLessThan(50);
    expect(
      loudness({ samples, fromSeconds: 1.1, toSeconds: 1.9 }),
    ).toBeGreaterThan(toneLoudness * 0.8);
    expect(
      loudness({ samples, fromSeconds: 2.1, toSeconds: 2.9 }),
    ).toBeLessThan(50);
  });
});
