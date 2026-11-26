import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { takeBlockedPrograms } from "./programGuard.js";

describe("the guard of each unit test", () => {
  it("refuses to start another program, and says to move the test to the end-to-end set", () => {
    expect(() => spawn(process.execPath, ["--version"])).toThrow(
      `A unit test started ${process.execPath}. A unit test runs in the test process only. Rename the test file to end in .e2e.test.ts`,
    );
    expect(takeBlockedPrograms()).toEqual([process.execPath]);
  });

  it("refuses a program that a test starts through promisify", async () => {
    const run = promisify(execFile);

    await expect(run("ffmpeg", ["-version"])).rejects.toThrow(
      "A unit test started ffmpeg.",
    );
    expect(takeBlockedPrograms()).toEqual(["ffmpeg"]);
  });
});
