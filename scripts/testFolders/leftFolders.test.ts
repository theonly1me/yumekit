import { describe, expect, it } from "vitest";
import { leftFoldersFailure } from "./leftFolders.ts";

describe("the folders that a test run leaves in the temporary folder", () => {
  it("names each prefix of a yumekit folder that a test left, with its count", () => {
    const failure = leftFoldersFailure([
      "yumekit-project-AbC123",
      "yumekit-fal-media-Q1w2E3",
      "yumekit-project-x9Y8z7",
      "yumekit-voice-words",
      "node-compile-cache",
      "playwright-artifacts-abcdef",
    ]);

    expect(failure).toBe(
      "The tests left 4 folders in the temporary folder: yumekit-project-* (2), yumekit-fal-media-* (1), yumekit-voice-words (1). Remove each folder when its test ends, for example with onTestFinished.",
    );
  });

  it("passes a run that left no yumekit folder", () => {
    expect(
      leftFoldersFailure(["node-compile-cache", "playwright-artifacts-abcdef"]),
    ).toBeUndefined();
  });
});
