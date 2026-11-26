import { describe, expect, it } from "vitest";
import type { WorkItem } from "../../chat/running/workSchema.js";
import { assetItem, takeOf } from "../../testing/takeFacts.js";
import { progressOf } from "./progress.js";

function runningPicture(id: string): WorkItem {
  return {
    id,
    kind: "media",
    what: "a picture",
    subject: id,
    state: "running",
    startedAt: "2026-11-26T10:00:00.000Z",
  };
}

describe("the progress of the open take", () => {
  it("counts the items made and the requests that still run", () => {
    const take = takeOf({
      id: "take-1",
      state: "open",
      items: ["a", "b", "c", "d", "e", "f"].map(assetItem),
    });
    const running = Array.from({ length: 12 }, (...[, index]) =>
      runningPicture(`p${String(index)}`),
    );

    expect(progressOf({ take, work: running })).toEqual({
      line: "Making 6 of 18 pictures",
      share: 6 / 18,
    });
  });

  it("says what is made so far while no request runs", () => {
    const take = takeOf({
      id: "take-1",
      state: "open",
      items: [assetItem("a")],
    });

    expect(progressOf({ take, work: [] }).line).toBe("1 picture made so far");
  });
});
