import { existsSync } from "node:fs";
import { describe, expect, it, onTestFinished } from "vitest";
import {
  createRenderProject,
  moduleScene,
  temporaryFolder,
} from "./renderProject.js";
import { solidColorCode } from "./sceneCodes.js";

describe("the folders of a render test", () => {
  it("leave the temporary folder of the system when the test that made them ends", async () => {
    const made: string[] = [];
    onTestFinished(() => {
      expect(made.filter((folder) => existsSync(folder))).toEqual([]);
    });

    made.push(
      await temporaryFolder(),
      await createRenderProject({
        edits: [moduleScene({ sceneId: "red", code: solidColorCode })],
      }),
    );

    expect(made.filter((folder) => existsSync(folder))).toEqual(made);
  });
});
