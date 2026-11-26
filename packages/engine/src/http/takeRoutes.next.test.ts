import { describe, expect, it } from "vitest";
import {
  lastRequestOf,
  leadReads,
  startWithReadyTake,
} from "../testing/readyTake.js";

describe("what follows the send of a take", { timeout: 120_000 }, () => {
  it("keeps the change of the lead's take out of the chat, and names the take with its step", async () => {
    const chat = await startWithReadyTake();
    await chat.writeScenario({ steps: leadReads([]) });

    await chat.post({ path: "/api/takes/take-1/send" });
    const { entries } = await chat.waitUntilIdle();

    expect(entries).toContainEqual(
      expect.objectContaining({ kind: "change", by: "ai", quiet: true }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: "change",
        summary: "You approved take 1 of the pictures.",
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: "request",
        text: "Take 1 of the pictures: all good. Go on.",
      }),
    );
  });

  it("approves the take and asks the lead for fewer clips with the money left", async () => {
    const chat = await startWithReadyTake();
    await chat.writeScenario({ steps: leadReads([]) });

    const sent = await chat.post({
      path: "/api/takes/take-1/send",
      body: { next: "fewer" },
    });
    const { entries } = await chat.waitUntilIdle();

    expect(sent.status).toBe(202);
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: "request",
        text: "Take 1 of the pictures: all good. Make fewer clips.",
      }),
    );
    const request = lastRequestOf(await chat.runs());
    expect(request).toContain("with no notes, so each item is approved");
    expect(request).toContain(
      "The person asks for fewer clips. The clips cost about $0.00, and $5.00 is left.",
    );
  });

  it("approves the take and starts no turn when the person stops there", async () => {
    const chat = await startWithReadyTake();
    const runsBefore = (await chat.runs()).length;

    const sent = await chat.post({
      path: "/api/takes/take-1/send",
      body: { next: "stop" },
    });
    const { entries } = await chat.waitUntilIdle();

    expect(sent.status).toBe(202);
    expect(JSON.parse(sent.body)).toMatchObject({
      take: { state: "sent" },
      entry: null,
    });
    expect((await chat.runs()).length).toBe(runsBefore);
    expect(entries.at(-1)).toMatchObject({
      kind: "change",
      summary: "You approved take 1 of the pictures, and stopped there.",
    });
  });
});
