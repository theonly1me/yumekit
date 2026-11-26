import { describe, expect, it } from "vitest";
import { connectCodexImages } from "./testing/connectCodexImages.ts";

describe("two Codex processes at the same time", () => {
  it("gives each picture call its own session, working folder, and picture, with no shared session", async () => {
    const codex = await connectCodexImages({
      scenario: { waitMilliseconds: 400 },
    });

    const [first, second] = await Promise.all([
      codex.makePicture({ file_stem: "first" }),
      codex.makePicture({ file_stem: "second" }),
    ]);

    expect(first.isError).not.toBe(true);
    expect(second.isError).not.toBe(true);
    const runs = await codex.runs();
    expect(runs).toHaveLength(2);
    const [firstRun, secondRun] = runs;
    expect(firstRun?.threadId).not.toBe(secondRun?.threadId);
    expect(firstRun?.folder).not.toBe(secondRun?.folder);
    for (const run of runs) {
      expect(run.arguments).toContain("--ephemeral");
      expect(run.arguments).toContain("--ignore-user-config");
      expect(run.arguments).not.toContain("resume");
      expect(run.folder).toContain("yumekit-codex-image-");
    }
  });
});
