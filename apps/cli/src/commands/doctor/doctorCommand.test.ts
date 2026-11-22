import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCliWorkspace } from "../../testing/runCli.js";

describe("yumekit doctor", () => {
  it("names the fix for a missing FFmpeg and a missing browser, and exits with 1", async () => {
    const workspace = await createCliWorkspace();
    const emptyFolder = join(workspace.root, "empty");
    await mkdir(emptyFolder);
    workspace.environment["PATH"] = emptyFolder;
    workspace.environment["PLAYWRIGHT_BROWSERS_PATH"] = emptyFolder;

    const run = await workspace.run(["doctor"]);

    expect(run.exitCode).toBe(1);
    expect(run.stdout.split("\n")).toEqual([
      `ok       Node.js ${process.versions.node}`,
      "missing  FFmpeg. ffmpeg is not on the PATH. Install FFmpeg and put it on the PATH. macOS: brew install ffmpeg. Debian or Ubuntu: sudo apt-get install ffmpeg. Windows: winget install ffmpeg.",
      "missing  Chromium for Playwright. Chromium for Playwright is not installed. Run: yumekit setup",
      "none     Agent programs. yumekit found none of Claude Code, Codex, or Cursor. The editor works without one.",
      "",
    ]);
  });

  it("says ok for each need when FFmpeg and Chromium are installed", async () => {
    const workspace = await createCliWorkspace();

    const run = await workspace.run(["doctor"]);

    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain("ok       FFmpeg\n");
    expect(run.stdout).toContain("ok       Chromium for Playwright\n");
  });
});
