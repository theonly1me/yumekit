import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { harnessWithSpeech } from "../testing/narrationFixture.js";

const runFile = promisify(execFile);

async function loudestDecibels(options: {
  file: string;
  startSeconds: number;
  seconds: number;
}): Promise<number> {
  const { stderr } = await runFile("ffmpeg", [
    ...["-v", "info", "-ss", String(options.startSeconds)],
    ...["-t", String(options.seconds), "-i", options.file],
    ...["-af", "volumedetect", "-f", "null", "-"],
  ]);
  const match = /max_volume: (-?[\d.]+|-inf) dB/.exec(stderr);
  const value = z.string().parse(match?.[1]);
  return value === "-inf" ? -Infinity : Number(value);
}

describe("a placed sound in the exported file", () => {
  it("plays at its place and is silent before it", async () => {
    const harness = await harnessWithSpeech();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "bell",
        capability: "sound-effect",
        input: { prompt: "a bell", duration_seconds: 1 },
      },
    });
    await harness.call({
      name: "place_sound",
      arguments: { output_id: "wide", asset_id: "bell", start_frame: 45 },
    });

    const rendered = await harness.call({
      name: "render_video",
      arguments: { output_id: "wide", scale: 0.25 },
    });

    const file = z.object({ file: z.string() }).parse(rendered.data).file;
    expect(
      await loudestDecibels({ file, startSeconds: 0.2, seconds: 1 }),
    ).toBeLessThan(-60);
    expect(
      await loudestDecibels({ file, startSeconds: 1.6, seconds: 0.8 }),
    ).toBeGreaterThan(-30);
  }, 180_000);
});
