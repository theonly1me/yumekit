import { describe, expect, it } from "vitest";
import { startWithReadyTake } from "../testing/readyTake.js";

describe("the take of a lead in the chat", { timeout: 120_000 }, () => {
  it("shows no change line of the person when the lead opens, fills, and readies a take in its turn", async () => {
    const chat = await startWithReadyTake();

    const { entries } = await chat.readChat();

    const changes = entries.filter((entry) => entry.kind === "change");
    expect(changes).toEqual([
      expect.objectContaining({ by: "ai", quiet: true }),
    ]);
  });
});
