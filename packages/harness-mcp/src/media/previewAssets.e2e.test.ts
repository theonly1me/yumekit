import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const runFile = promisify(execFile);

async function importVideo(options: {
  harness: Harness;
  assetId: string;
  size: string;
  marks?: unknown[];
}): Promise<void> {
  const file = join(options.harness.folder, "..", `${options.assetId}.mp4`);
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", `testsrc=duration=4:size=${options.size}:rate=30`],
    ...["-pix_fmt", "yuv420p", file],
  ]);
  const imported = await options.harness.call({
    name: "import_asset",
    arguments: {
      asset_id: options.assetId,
      kind: "video",
      source_path: file,
      ...(options.marks === undefined ? {} : { marks: options.marks }),
    },
  });
  expect(imported.isError).toBe(false);
}

function jpegSizeOf(base64: string): { width: number; height: number } {
  const bytes = Buffer.from(base64, "base64");
  let offset = 2;
  while (offset < bytes.length) {
    const marker = bytes.readUInt16BE(offset);
    const length = bytes.readUInt16BE(offset + 2);
    if (marker === 0xffc0 || marker === 0xffc2) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("The picture is not a JPEG file");
}

function imagesOf(result: { content: { type: string }[] }): string[] {
  return result.content.flatMap((content) =>
    "data" in content && typeof content.data === "string" ? [content.data] : [],
  );
}

describe("preview_assets", () => {
  it("shows a video as one sheet of frames at even steps, with their times, length, and marks", async () => {
    const harness = await startHarness();
    await importVideo({
      harness,
      assetId: "screen",
      size: "320x200",
      marks: [{ name: "the prompt", seconds: 2 }],
    });

    const looked = await harness.call({
      name: "preview_assets",
      arguments: { assets: [{ asset_id: "screen" }] },
    });

    expect(looked.isError).toBe(false);
    expect(looked.data["assets"]).toEqual([
      {
        asset_id: "screen",
        kind: "video",
        width_pixels: 320,
        height_pixels: 200,
        duration_seconds: 4,
        seconds: [0, 0.33, 0.67, 1, 1.33, 1.67, 2, 2.33, 2.67, 3, 3.33, 3.67],
        marks: [{ name: "the prompt", seconds: 2 }],
      },
    ]);
    expect(looked.text).toContain("screen: video 320x200, 4s");
    expect(looked.text).toContain("Marks (dashed boxes): the prompt.");
    expect(imagesOf(looked.result)).toHaveLength(1);
  });

  it("looks at several assets in one call, one picture for each", async () => {
    const harness = await startHarness();
    await importVideo({ harness, assetId: "wide", size: "320x180" });
    await importVideo({ harness, assetId: "tall", size: "180x320" });

    const looked = await harness.call({
      name: "preview_assets",
      arguments: {
        assets: [
          { asset_id: "wide", count: 4 },
          { asset_id: "tall", from_seconds: 2, to_seconds: 4, count: 4 },
        ],
      },
    });

    const [wide, tall] = imagesOf(looked.result).map(jpegSizeOf);
    expect(wide?.width).toBeGreaterThan(wide?.height ?? 0);
    expect(tall?.height).toBeGreaterThan(0);
    const seconds = Array.isArray(looked.data["assets"])
      ? looked.data["assets"].map(
          (asset: { seconds: number[] }) => asset.seconds,
        )
      : [];
    expect(seconds).toEqual([
      [0, 1, 2, 3],
      [2, 2.5, 3, 3.5],
    ]);
  });

  it("a region shows only that part, in the shape of the part", async () => {
    const harness = await startHarness();
    await importVideo({ harness, assetId: "screen", size: "320x200" });

    const looked = await harness.call({
      name: "preview_assets",
      arguments: {
        assets: [
          {
            asset_id: "screen",
            count: 2,
            region: { x: 0, y: 0, width: 1, height: 0.25 },
          },
        ],
      },
    });

    const [sheet] = imagesOf(looked.result).map(jpegSizeOf);
    expect(sheet).toEqual({
      width: 480 + 2 * 4,
      height: 30 + 2 * (480 / 6.4 + 22 + 4) + 4,
    });
  });

  it("refuses a sound asset and names the kind", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "beep",
        capability: "sound-effect",
        input: { prompt: "a beep", duration_seconds: 1 },
      },
    });

    const looked = await harness.call({
      name: "preview_assets",
      arguments: { assets: [{ asset_id: "beep" }] },
    });

    expect(looked.isError).toBe(true);
    expect(looked.data["kind"]).toBe("asset-has-no-picture");
  });
});
