import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { pricedFixture } from "../testing/pricedFixture.js";
import type { MediaTools } from "../types.js";
import { requestFileOf } from "./requestFile.js";

function picture(options: {
  tools: MediaTools;
  outputDirectory: string;
  fileStem: string;
}) {
  return options.tools.run({
    capability: "image",
    server: "priced",
    input: {
      prompt: "A paper lantern on a wet street",
      width_pixels: 32,
      reference_image_paths: [join(options.outputDirectory, "sheet.png")],
    },
    outputDirectory: options.outputDirectory,
    fileStem: options.fileStem,
    about: { shotId: "street" },
  });
}

describe("the record of media requests", () => {
  it("records a paid call and a call that the spending limit refused, the newest first, with the prompt, pictures, settings, cost, and failure", async () => {
    const { tools, outputDirectory, projectFolder } = await pricedFixture({
      spendingUsd: 0.5,
    });
    await picture({ tools, outputDirectory, fileStem: "first" });
    await picture({ tools, outputDirectory, fileStem: "second" });

    const read = await tools.requests();
    const text = await readFile(requestFileOf(projectFolder), "utf8");

    expect(read.ok ? read.value : read.failure).toMatchObject([
      {
        asset_id: "second",
        shot_id: "street",
        server: "priced",
        model: "priced-image",
        prompt_from_you: "A paper lantern on a wet street",
        pictures: [{ role: "reference", file: "assets/sheet.png" }],
        settings: { width_pixels: 32 },
        failure: { kind: "spending-limit-reached" },
      },
      {
        asset_id: "first",
        server: "priced",
        usd: 0.4,
        basis: "catalog",
        files: [expect.stringMatching(/^assets\/first\./)],
      },
    ]);
    expect(read.ok ? read.value[0]?.failure?.message : "").toContain(
      "The project has spent 0.40 US dollars of its limit of 0.50 US dollars",
    );
    expect(text).not.toContain("made-up-priced-key");
    expect(text.indexOf('"asset_id"')).toBeLessThan(text.indexOf('"at"'));
    expect(text.endsWith("}\n")).toBe(true);
  });

  it("keeps the newest 500 requests", async () => {
    const { tools, outputDirectory, projectFolder } = await pricedFixture({});
    const old = Array.from({ length: 500 }, (...[, index]) => ({
      asset_id: `old-${String(index)}`,
      at: "2026-11-24T10:00:00.000Z",
      capability: "image",
      pictures: [],
      seconds: 1,
      settings: {},
    }));
    await mkdir(dirname(requestFileOf(projectFolder)), { recursive: true });
    await writeFile(
      requestFileOf(projectFolder),
      JSON.stringify({ requests: old }),
    );

    await picture({ tools, outputDirectory, fileStem: "newest" });
    const read = await tools.requests();
    const records = read.ok ? read.value : [];

    expect(records).toHaveLength(500);
    expect(records[0]?.asset_id).toBe("newest");
    expect(records.at(-1)?.asset_id).toBe("old-1");
  });
});
