import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const runFile = promisify(execFile);

async function importVideo(options: {
  harness: Harness;
  assetId: string;
  withAudio: boolean;
}) {
  const { harness, assetId } = options;
  const source = join(harness.folder, "..", `${assetId}.mp4`);
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "color=c=blue:s=64x48:r=24:d=1"],
    ...(options.withAudio
      ? ["-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:a", "aac"]
      : []),
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", source],
  ]);
  return harness.call({
    name: "import_asset",
    arguments: { asset_id: assetId, kind: "video", source_path: source },
  });
}

describe("import_asset with the sound of a video", () => {
  it("records hasAudio true for a video file with sound", async () => {
    const harness = await startHarness();

    const result = await importVideo({
      harness,
      assetId: "talk",
      withAudio: true,
    });

    expect(result.isError).toBe(false);
    expect(harness.store.read().assets[0]).toMatchObject({
      id: "talk",
      kind: "video",
      durationFrames: 30,
      hasAudio: true,
    });
  });

  it("records hasAudio false for a video file without sound", async () => {
    const harness = await startHarness();

    await importVideo({ harness, assetId: "quiet", withAudio: false });

    expect(harness.store.read().assets[0]).toMatchObject({
      id: "quiet",
      hasAudio: false,
    });
  });
});
