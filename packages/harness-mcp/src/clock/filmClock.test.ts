import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startDraftStory } from "../testing/leadDesignFixture.js";

const timesSchema = z.object({
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
});

const clockFileSchema = z.object({
  targetMinutes: z.number(),
  stages: z.record(z.string(), timesSchema),
});

describe("the clock of a film", { timeout: 120_000 }, () => {
  it("records the start and the end of each stage, and get_work shows the times and the time left", async () => {
    const harness = await startDraftStory(["strike"]);
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "strike-start",
        capability: "image",
        shot_id: "strike",
        input: { width_pixels: 32, height_pixels: 18 },
      },
    });

    const work = await harness.call({ name: "get_work" });
    const file = clockFileSchema.parse(
      JSON.parse(
        await readFile(join(harness.folder, ".yumekit", "clock.json"), "utf8"),
      ),
    );
    const plan = file.stages["plan"];

    expect(file.targetMinutes).toBe(10);
    expect(Object.keys(file.stages).sort()).toEqual([
      "plan",
      "sheets",
      "start-pictures",
    ]);
    expect(Date.parse(plan?.endedAt ?? "")).toBeGreaterThanOrEqual(
      Date.parse(plan?.startedAt ?? ""),
    );
    expect(work.text).toContain("### The clock");
    expect(work.text).toContain("Target: 10 minutes.");
    expect(work.text).toMatch(/Time left: \d/);
    expect(work.text).toMatch(
      /Stages: plan \d[^;]*; sheets \d[^;]*; start pictures \d/,
    );
  });
});
