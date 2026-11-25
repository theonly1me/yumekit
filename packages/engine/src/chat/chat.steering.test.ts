import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { init, result, toolResult, toolUse } from "./testing/claudeLines.js";
import { startChatEngine, type FakeStep } from "./testing/chatEngine.js";
import { firstTextOf, savedResultOf } from "./testing/savedResult.js";

const direction = "Stop adding scenes. Make the title say Hello.";

function stepsThatWaitThenCall(folder: string): FakeStep[] {
  return [
    { print: init },
    { waitForFile: join(folder, "sent") },
    { print: toolUse({ callId: "call-1", tool: "get_scene" }) },
    {
      callTool: {
        name: "get_scene",
        input: { scene_id: "no-such-scene" },
        saveResultTo: join(folder, "first.json"),
      },
    },
    { print: toolResult({ callId: "call-1", isError: true }) },
    {
      callTool: {
        name: "get_project",
        input: {},
        saveResultTo: join(folder, "second.json"),
      },
    },
    { print: result("completed") },
  ];
}

describe("a message of the person while the AI works", () => {
  it("is stored at once, and reaches the AI once, in the answer of its next tool call, also when that call fails", async () => {
    const chat = await startChatEngine({ steps: [] });
    const folder = chat.project.root;
    await chat.writeScenario({ steps: stepsThatWaitThenCall(folder) });
    await chat.ask({ text: "Make a film of three scenes." });

    const sent = await chat.ask({ text: direction });
    expect(sent.status).toBe(202);
    expect(JSON.parse(sent.body)).toMatchObject({
      kind: "steering",
      text: direction,
      state: "waiting",
    });
    await writeFile(join(folder, "sent"), "");
    const { entries } = await chat.waitUntilIdle();

    const first = await savedResultOf(join(folder, "first.json"));
    expect(first.isError).toBe(true);
    const block = firstTextOf(first);
    expect(block).toContain(direction);
    expect(block).toContain("The person sent this while you worked.");
    expect(block).toContain("the message of the person wins");
    expect(first.mcpResult.structuredContent).toMatchObject({
      kind: "scene-not-found",
      person_messages: { messages: [{ text: direction }] },
    });
    const second = await savedResultOf(join(folder, "second.json"));
    expect(JSON.stringify(second)).not.toContain(direction);
    expect(entries.map((entry) => entry.kind)).toEqual([
      "request",
      "answer",
      "steering",
      "answer",
    ]);
    expect(entries[2]).toMatchObject({ text: direction, state: "read" });
    expect(entries[3]).toMatchObject({
      state: "done",
      steps: [expect.objectContaining({ tool: "get_scene", state: "failed" })],
    });
    expect(await chat.runs()).toHaveLength(1);
  });

  it("refuses a message that the AI itself sends, from the lead or from a helper", async () => {
    const chat = await startChatEngine({ steps: [] });
    for (const header of [
      { "x-yumekit-client": "agent" },
      { "x-yumekit-helper": "made-up-helper-token" },
    ]) {
      const sent = await rawRequest({
        port: chat.engine.port,
        path: "/api/chat/requests",
        method: "POST",
        headers: withToken({
          token: chat.engine.token,
          headers: { "content-type": "application/json", ...header },
        }),
        body: JSON.stringify({ text: direction }),
      });
      expect(sent.status).toBe(403);
      expect(JSON.parse(sent.body)).toMatchObject({
        kind: "message-not-for-the-ai",
      });
    }
    expect((await chat.readChat()).entries).toEqual([]);
  });
});
