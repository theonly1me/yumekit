import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderVideo } from "./index.js";
import { decodeAudio, loudness, probeVideo } from "./testing/probe.js";
import { temporaryFolder } from "./testing/renderProject.js";
import { movingMarkerVideo } from "./testing/testVideo.js";
import { valueOf } from "./testing/valueOf.js";
import { createVideoProject, videoClipScene } from "./testing/videoProject.js";

const soundOfClip = {
  id: "clip-sound",
  assetId: "clip",
  startFrame: 30,
  durationFrames: 30,
  assetStartFrame: 0,
  gainDecibels: 0,
};

async function renderedFile(folder: string): Promise<string> {
  const destination = join(await temporaryFolder(), "video.mp4");
  valueOf(
    await renderVideo({ folder, outputId: "wide", destination, scale: 0.25 }),
  );
  return destination;
}

describe("renderVideo with the sound of a video asset", () => {
  it("mixes the sound of a video asset from the frame of its audio clip", async () => {
    const folder = await createVideoProject({
      video: { ...movingMarkerVideo, withAudio: true },
      clipFrames: 60,
      scene: videoClipScene({ assetId: "clip" }),
      audioClips: [soundOfClip],
    });

    const file = await renderedFile(folder);

    const streams = await probeVideo(file);
    expect(streams.map((stream) => stream.codec_type)).toEqual([
      "video",
      "audio",
    ]);
    const samples = await decodeAudio(file);
    expect(
      loudness({ samples, fromSeconds: 0.1, toSeconds: 0.9 }),
    ).toBeLessThan(50);
    expect(
      loudness({ samples, fromSeconds: 1.1, toSeconds: 1.9 }),
    ).toBeGreaterThan(2000);
  });

  it("refuses an audio clip of a video asset without sound in the store", async () => {
    await expect(
      createVideoProject({
        video: movingMarkerVideo,
        clipFrames: 60,
        audioClips: [soundOfClip],
      }),
    ).rejects.toThrow("has no sound");
  });

  it("passes the repeat check for a timeline with a video-clip scene", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: 45,
      scene: videoClipScene({ assetId: "clip", caption: "A clip" }),
    });

    const file = await renderedFile(folder);

    const [video] = await probeVideo(file);
    expect(video).toMatchObject({ codec_type: "video", nb_read_frames: "45" });
  });
});
