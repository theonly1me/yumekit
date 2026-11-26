import { describe, expect, it } from "vitest";
import { rawRequest, withToken } from "../../testing/rawRequest.js";
import { startChatEngine } from "../testing/chatEngine.js";
import {
  answerCard,
  askSteps,
  permissionEntriesOf,
  savedReplyOf,
  waitForOpenCard,
} from "./testing/permissionChat.js";

const pageAsk = {
  toolName: "WebFetch",
  input: { url: "https://example.com/", prompt: "Describe the page." },
  name: "page",
};

describe("the permission card of the lead", () => {
  it("shows what the lead wants to do, waits for the person, and gives the program the answer", async () => {
    const chat = await startChatEngine({ steps: [] });
    await chat.writeScenario({ steps: askSteps({ chat, asks: [pageAsk] }) });

    await chat.ask({ text: "Open example.com and describe it." });
    const card = await waitForOpenCard(chat);
    const isStillRunning = (await chat.readChat()).state === "running";
    const answered = await answerCard({
      chat,
      id: card.id,
      answer: "allow-once",
    });
    await chat.waitUntilIdle();

    expect(card).toMatchObject({
      what: "Open a web page",
      detail: "https://example.com/",
    });
    expect(isStillRunning).toBe(true);
    expect(answered.status).toBe(200);
    expect(await savedReplyOf({ chat, name: "page" })).toEqual({
      behavior: "allow",
    });
    expect(await permissionEntriesOf(chat)).toMatchObject([
      { id: card.id, state: "allowed-once" },
    ]);
  });

  it("gives the program the refusal of the person", async () => {
    const chat = await startChatEngine({ steps: [] });
    await chat.writeScenario({ steps: askSteps({ chat, asks: [pageAsk] }) });

    await chat.ask({ text: "Open example.com and describe it." });
    const card = await waitForOpenCard(chat);
    await answerCard({ chat, id: card.id, answer: "deny" });
    await chat.waitUntilIdle();

    const reply = await savedReplyOf({ chat, name: "page" });

    expect(reply.behavior).toBe("deny");
    expect(reply.message).toContain("The person did not allow this.");
  });

  it("answers Don't allow, with a line that says so, when the person gives no answer in time", async () => {
    const chat = await startChatEngine({
      steps: [],
      permissionWaitMilliseconds: 200,
    });
    await chat.writeScenario({ steps: askSteps({ chat, asks: [pageAsk] }) });

    await chat.ask({ text: "Open example.com and describe it." });
    await chat.waitUntilIdle();
    const reply = await savedReplyOf({ chat, name: "page" });

    expect(reply.behavior).toBe("deny");
    expect(reply.message).toContain("did not answer in 10 minutes");
    expect(await permissionEntriesOf(chat)).toMatchObject([
      { state: "timed-out" },
    ]);
  });

  it("lets only the person answer a card", async () => {
    const chat = await startChatEngine({ steps: [] });
    await chat.writeScenario({ steps: askSteps({ chat, asks: [pageAsk] }) });

    await chat.ask({ text: "Open example.com and describe it." });
    const card = await waitForOpenCard(chat);
    const byTheAi = await rawRequest({
      port: chat.engine.port,
      path: `/api/chat/permissions/${card.id}`,
      method: "POST",
      headers: withToken({
        token: chat.engine.token,
        headers: {
          "content-type": "application/json",
          "x-yumekit-client": "agent",
        },
      }),
      body: JSON.stringify({ answer: "allow-once" }),
    });
    await answerCard({ chat, id: card.id, answer: "deny" });
    await chat.waitUntilIdle();

    expect(byTheAi.status).toBe(403);
    expect(await savedReplyOf({ chat, name: "page" })).toMatchObject({
      behavior: "deny",
    });
  });
});
