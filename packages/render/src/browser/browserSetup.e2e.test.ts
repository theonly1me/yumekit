import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { browserInstallCommand } from "../index.js";

const runFile = promisify(execFile);

describe("browserInstallCommand", () => {
  it("runs the Playwright install of this package for Chromium only", async () => {
    const install = browserInstallCommand();

    const { stdout } = await runFile(install.command, [
      ...install.args,
      "--dry-run",
    ]);

    expect(install.args.slice(1)).toEqual(["install", "chromium"]);
    expect(stdout).toContain("playwright chromium v");
    expect(stdout).not.toContain("firefox");
    expect(stdout).not.toContain("webkit");
  });
});
