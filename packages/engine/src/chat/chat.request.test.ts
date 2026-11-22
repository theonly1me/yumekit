import { describe, expect, it } from "vitest";
import { callTool, rawRequest, withToken } from "../testing/rawRequest.js";
import {
  init,
  part,
  result,
  toolResult,
  toolUse,
  whole,
} from "./testing/claudeLines.js";
import { startChatEngine, type FakeStep } from "./testing/chatEngine.js";

function setScriptCall(options: {
  callId: string;
  script: string;
}): FakeStep[] {
  return [
    { print: toolUse({ callId: options.callId, tool: "set_script" }) },
    { callTool: { name: "set_script", input: { script: options.script } } },
    { print: toolResult({ callId: options.callId, isError: false }) },
  ];
}

const twoChangesRequest: FakeStep[] = [
  { print: init },
  { print: part("I will write ") },
  { print: part("the script.") },
  { print: whole("I will write the script.") },
  ...setScriptCall({ callId: "call-1", script: "almost" }),
  ...setScriptCall({ callId: "call-2", script: "ready" }),
  { print: whole("Done. The script now says ready.") },
  { print: result("completed") },
];

async function scriptOf(chat: Awaited<ReturnType<typeof startChatEngine>>) {
  const answer = await rawRequest({
    port: chat.engine.port,
    path: "/api/project",
    headers: withToken(chat.engine),
  });
  const snapshot: unknown = JSON.parse(answer.body);
  const script: unknown =
    typeof snapshot === "object" && snapshot !== null
      ? Reflect.get(snapshot, "script")
      : undefined;
  return script;
}

describe("a chat request", () => {
  it("changes the project through the engine and records the request, the answer with its steps, and one change with two undo steps", async () => {
    const chat = await startChatEngine({ steps: twoChangesRequest });
    await callTool({
      ...chat.engine,
      name: "set_script",
      input: { script: "draft" },
    });

    const asked = await chat.ask({
      text: "Set the script to the single word ready.",
    });
    expect(asked.status).toBe(202);
    expect(JSON.parse(asked.body)).toMatchObject({
      kind: "request",
      text: "Set the script to the single word ready.",
      about: null,
    });
    const { entries } = await chat.waitUntilIdle();

    expect(await scriptOf(chat)).toBe("ready");
    expect(entries.slice(1)).toEqual([
      expect.objectContaining({ kind: "request" }),
      expect.objectContaining({
        kind: "answer",
        state: "done",
        text: "I will write the script.\n\nDone. The script now says ready.",
        steps: [
          { callId: "call-1", tool: "set_script", state: "done" },
          { callId: "call-2", tool: "set_script", state: "done" },
        ],
      }),
      expect.objectContaining({
        kind: "change",
        by: "ai",
        summary: "The script now says ready.",
        undoSteps: 2,
        undone: false,
      }),
    ]);
    expect(chat.events.messages).toContainEqual({
      type: "chat-text",
      id: entries[2]?.id,
      text: "I will write ",
    });
    expect(chat.events.messages).toContainEqual(
      expect.objectContaining({ type: "chat-changed" }),
    );

    const changeId = entries[3]?.id ?? "";
    const undone = await chat.post({
      path: `/api/chat/changes/${changeId}/undo`,
    });
    expect(undone.status).toBe(200);
    expect(JSON.parse(undone.body)).toMatchObject({
      undoSteps: 0,
      undone: true,
    });
    expect(await scriptOf(chat)).toBe("draft");
  });
});
