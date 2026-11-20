import { describe, expect, it } from "vitest";
import type { Edit, ProjectStore } from "../index.js";
import {
  createTestProject,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const sound = {
  id: "sound",
  startFrame: 0,
  durationFrames: 60,
  assetStartFrame: 0,
  gainDecibels: -12,
};

async function videoAsset(options: {
  store: ProjectStore;
  assetId: string;
  hasAudio?: boolean;
}): Promise<Edit> {
  const file = `assets/files/${options.assetId}.mp4`;
  await writeProjectFile({
    folder: options.store.folder,
    file,
    content: `video ${options.assetId}`,
  });
  return {
    kind: "addAsset",
    asset: {
      id: options.assetId,
      kind: "video",
      file,
      durationFrames: 90,
      ...(options.hasAudio === undefined ? {} : { hasAudio: options.hasAudio }),
      source: { kind: "import", originalName: `${options.assetId}.mp4` },
    },
  };
}

async function projectWithVideos(): Promise<ProjectStore> {
  const store = await createTestProject();
  await store.applyEdits([
    await videoAsset({ store, assetId: "loud", hasAudio: true }),
    await videoAsset({ store, assetId: "silent", hasAudio: false }),
    await videoAsset({ store, assetId: "unknown" }),
    {
      kind: "setTimeline",
      timeline: {
        outputId: "wide",
        tracks: [{ id: "video-sound", kind: "audio", clips: [] }],
      },
    },
  ]);
  return store;
}

function addSoundOf(assetId: string): Edit {
  return {
    kind: "addClip",
    outputId: "wide",
    trackId: "video-sound",
    clip: { ...sound, assetId },
  };
}

describe("audio clips of video assets", () => {
  it("keeps hasAudio on the asset record", async () => {
    const store = await projectWithVideos();
    expect(
      store.read().assets.map((asset) => [asset.id, asset.hasAudio]),
    ).toEqual([
      ["loud", true],
      ["silent", false],
      ["unknown", undefined],
    ]);
  });

  it("accepts an audio clip of a video asset with sound", async () => {
    const store = await projectWithVideos();
    const result = await store.applyEdits([addSoundOf("loud")]);
    expect(result.ok).toBe(true);
    expect(store.read().timelines[0]?.tracks[0]?.clips).toEqual([
      { ...sound, assetId: "loud" },
    ]);
  });

  it("refuses an audio clip of a video asset without sound", async () => {
    const store = await projectWithVideos();
    const result = await store.applyEdits([addSoundOf("silent")]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
    expect(result.ok || result.failure.message).toContain("has no sound");
  });

  it("refuses an audio clip of a video asset that does not record hasAudio", async () => {
    const store = await projectWithVideos();
    const result = await store.applyEdits([addSoundOf("unknown")]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("refuses an audio clip that reads past the end of the video", async () => {
    const store = await projectWithVideos();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "video-sound",
        clip: { ...sound, assetId: "loud", durationFrames: 91 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });
});
