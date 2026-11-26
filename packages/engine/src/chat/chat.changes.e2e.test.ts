import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { startChatEngine } from "./testing/chatEngine.js";

describe("the changes in the chat", () => {
  it("records a change by the person with its sentence, and follows undo and redo of the tools", async () => {
    const chat = await startChatEngine({ steps: [] });

    await callTool({
      ...chat.engine,
      name: "set_script",
      input: { script: "one" },
    });
    await callTool({
      ...chat.engine,
      name: "set_script",
      input: { script: "two" },
    });
    await callTool({ ...chat.engine, name: "get_project", input: {} });
    const [first, second] = (await chat.readChat()).entries;
    expect([first, second]).toEqual([
      {
        kind: "change",
        id: first?.id,
        by: "person",
        summary: "You changed the script.",
        undoSteps: 1,
        undone: false,
      },
      expect.objectContaining({ kind: "change", undoSteps: 1, undone: false }),
    ]);

    await callTool({ ...chat.engine, name: "undo", input: {} });
    expect((await chat.readChat()).entries).toEqual([
      expect.objectContaining({ undone: false, undoSteps: 1 }),
      expect.objectContaining({ undone: true, undoSteps: 0 }),
    ]);

    await callTool({ ...chat.engine, name: "redo", input: {} });
    expect((await chat.readChat()).entries).toEqual([
      expect.objectContaining({ undone: false, undoSteps: 1 }),
      expect.objectContaining({ undone: false, undoSteps: 1 }),
    ]);
  });

  it("undoes a change and each later change with the undo request", async () => {
    const chat = await startChatEngine({ steps: [] });
    await callTool({
      ...chat.engine,
      name: "set_script",
      input: { script: "one" },
    });
    await callTool({
      ...chat.engine,
      name: "set_script",
      input: { script: "two" },
    });
    const [first] = (await chat.readChat()).entries;

    const undone = await chat.post({
      path: `/api/chat/changes/${first?.id ?? ""}/undo`,
    });

    expect(undone.status).toBe(200);
    expect((await chat.readChat()).entries).toEqual([
      expect.objectContaining({ undone: true, undoSteps: 0 }),
      expect.objectContaining({ undone: true, undoSteps: 0 }),
    ]);
    const missing = await chat.post({ path: "/api/chat/changes/nothing/undo" });
    expect(missing.status).toBe(404);
  });

  it("marks a change by an agent outside a chat request as a change by the AI", async () => {
    const chat = await startChatEngine({ steps: [] });

    await callTool({
      ...chat.engine,
      name: "set_script",
      input: { script: "from a terminal agent" },
      headers: { "x-yumekit-client": "agent" },
    });

    expect((await chat.readChat()).entries).toEqual([
      expect.objectContaining({
        by: "ai",
        summary: "An agent changed the project.",
        undoSteps: 1,
      }),
    ]);
  });
});
