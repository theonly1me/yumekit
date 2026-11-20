import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { formatVersion, version } from "./index.js";

function readPackageVersion(packageJsonText: string): unknown {
  const packageJson: unknown = JSON.parse(packageJsonText);
  if (typeof packageJson !== "object" || packageJson === null) {
    return undefined;
  }
  return "version" in packageJson ? packageJson.version : undefined;
}

describe("yumekit version", () => {
  it("matches the version in package.json", async () => {
    const packageJsonText = await readFile(
      new URL("../package.json", import.meta.url),
      "utf8",
    );

    expect(readPackageVersion(packageJsonText)).toBe(version);
  });

  it("prints the command name and the version on one line", () => {
    expect(formatVersion("1.2.3")).toBe("yumekit 1.2.3\n");
  });
});
