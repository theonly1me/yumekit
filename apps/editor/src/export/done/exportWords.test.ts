import { describe, expect, it } from "vitest";
import type { ExportEntry } from "./exportEntry.js";
import { revealLabelOf, revealPlaceOf, runningLineOf } from "./exportWords.js";

const exporting: ExportEntry = {
  kind: "export",
  id: "export-1",
  by: "approval",
  state: "running",
  scale: 1,
  jobs: [
    {
      callId: "call-wide",
      outputId: "wide",
      platformIds: ["youtube"],
      state: "exporting",
      files: [],
    },
    {
      callId: "call-tall",
      outputId: "tall",
      platformIds: ["tiktok", "instagram-reel"],
      state: "waiting",
      files: [],
    },
  ],
};

describe("the words of an export", () => {
  it("names the platform and the share of the frames that are done", () => {
    const progress = new Map([["call-wide", { done: 36, total: 90 }]]);

    expect(runningLineOf({ entry: exporting, progress })).toBe(
      "Exporting the YouTube file, 40% (1 of 2)",
    );
  });

  it("names each platform of a file that two places share", () => {
    const [wide, tall] = exporting.jobs;
    if (wide === undefined || tall === undefined) throw new Error("No jobs");
    const second: ExportEntry = {
      ...exporting,
      jobs: [
        { ...wide, state: "done" },
        { ...tall, state: "exporting" },
      ],
    };

    expect(runningLineOf({ entry: second, progress: new Map() })).toBe(
      "Exporting the TikTok and Instagram Reel files, 0% (2 of 2)",
    );
  });

  it("names the file manager of the computer of the browser", () => {
    const labels = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    ].map((agent) => revealLabelOf(revealPlaceOf(agent)));

    expect(labels).toEqual([
      "Show in Finder",
      "Show in File Explorer",
      "Open the folder",
    ]);
  });
});
