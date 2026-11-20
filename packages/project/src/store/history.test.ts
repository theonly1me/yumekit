import { describe, expect, it } from "vitest";
import { createTestProject } from "../testing/projectFixtures.js";

describe("undo history", () => {
  it("keeps the last 200 steps", async () => {
    const store = await createTestProject();
    for (let stepNumber = 1; stepNumber <= 201; stepNumber += 1) {
      await store.applyEdits([
        { kind: "setScript", script: `step ${String(stepNumber)}` },
      ]);
    }
    for (let undoCount = 0; undoCount < 200; undoCount += 1) {
      expect((await store.undo()).ok).toBe(true);
    }
    expect(store.read().script).toBe("step 1");
    expect(await store.undo()).toEqual({
      ok: false,
      failure: "nothing-to-undo",
    });
  }, 30_000);
});
