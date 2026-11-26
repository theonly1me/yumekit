import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { setPlan } from "../testing/storyFixture.js";

const runFile = promisify(execFile);

const volumes = {
  "quiet-then-rising": "if(lt(t,6),0.02,min(1,(t-6)/8))",
  "loud-then-fading": "max(0.02,1-t/8)",
} as const;

async function track(options: {
  harness: Harness;
  shape: keyof typeof volumes;
}): Promise<string> {
  const file = join(options.harness.folder, "..", `${options.shape}.wav`);
  await runFile("ffmpeg", [
    ...[
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "anoisesrc=d=14:a=0.5:seed=7",
    ],
    ...["-af", `volume='${volumes[options.shape]}':eval=frame`, file],
  ]);
  await options.harness.call({
    name: "import_asset",
    arguments: { asset_id: options.shape, kind: "audio", source_path: file },
  });
  return options.shape;
}

async function risingPlan(harness: Harness): Promise<void> {
  await setPlan({
    harness,
    shots: [
      { shot_id: "calm", music_intensity: 1 },
      { shot_id: "fight", music_intensity: 5 },
    ],
  });
}

describe("check_music", () => {
  it("finds the part of a rising track that fits a rising map, and stores the check", async () => {
    const harness = await startHarness();
    await risingPlan(harness);
    const assetId = await track({ harness, shape: "quiet-then-rising" });

    const result = await harness.call({
      name: "check_music",
      arguments: { asset_id: assetId },
    });

    expect(result.data["fit"]).toBeGreaterThan(0.7);
    expect(result.data["start_seconds"]).toBeGreaterThanOrEqual(2);
    expect(result.data["start_seconds"]).toBeLessThanOrEqual(6);
    expect(harness.store.read().bible.storyPlan?.musicChecks).toMatchObject([
      { assetId },
    ]);
  });

  it("warns about a track that starts at full level and fades against a rising map", async () => {
    const harness = await startHarness();
    await risingPlan(harness);
    const assetId = await track({ harness, shape: "loud-then-fading" });

    const result = await harness.call({
      name: "check_music",
      arguments: { asset_id: assetId },
    });
    const warnings = JSON.stringify(result.data["warnings"]);

    expect(warnings).toContain("The music starts near its full level");
    expect(warnings).toContain("does not rise and fall with the story");
  });
});
