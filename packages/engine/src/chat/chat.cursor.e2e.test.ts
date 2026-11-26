import { readFile, realpath, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cursorInit,
  cursorMadeUpSessionId,
  cursorResult,
  cursorSetScript,
  cursorText,
} from "./testing/cursorLines.js";
import { startChatEngine, type FakeStep } from "./testing/chatEngine.js";

const callId = "call-made-up\nfc_made-up_0";

const setScriptRequest: FakeStep[] = [
  { print: cursorInit },
  { print: cursorText({ text: "I will set it.", isPart: true }) },
  { print: cursorText({ text: "I will set it.", isPart: false }) },
  { print: cursorSetScript({ callId, subtype: "started" }) },
  { callTool: { name: "set_script", input: { script: "ready" } } },
  { print: cursorSetScript({ callId, subtype: "completed" }) },
  { print: cursorText({ text: "The script now says ready.", isPart: true }) },
  { print: cursorText({ text: "The script now says ready.", isPart: false }) },
  { print: cursorResult },
];

async function startCursorChat() {
  const chat = await startChatEngine({ steps: setScriptRequest });
  const programPath = join(chat.project.root, "fake-agent", "claude");
  await writeFile(
    join(chat.project.configurationDirectory, "settings.json"),
    JSON.stringify({ agent: "cursor", agentPrograms: { cursor: programPath } }),
  );
  return chat;
}

describe("a chat request with Cursor", () => {
  it("runs with agent set to cursor, changes the project, and resumes the session of the first request", async () => {
    const chat = await startCursorChat();

    expect((await chat.ask({ text: "Set the script to ready." })).status).toBe(
      202,
    );
    const { entries } = await chat.waitUntilIdle();

    expect(entries).toEqual([
      expect.objectContaining({ kind: "request" }),
      expect.objectContaining({
        kind: "answer",
        state: "done",
        text: "I will set it.\n\nThe script now says ready.",
        steps: [{ callId, tool: "set_script", state: "done" }],
      }),
      expect.objectContaining({ kind: "change", by: "ai", undoSteps: 1 }),
    ]);

    await chat.ask({ text: "Again." });
    await chat.waitUntilIdle();
    const [first, second] = await chat.runs();
    const agentFolder = join(
      await realpath(chat.project.projectFolder),
      ".yumekit",
      "agent-cursor",
    );
    expect(first?.slice(0, 8)).toEqual([
      "-p",
      "--output-format",
      "stream-json",
      "--stream-partial-output",
      "--approve-mcps",
      "--trust",
      "--workspace",
      agentFolder,
    ]);
    expect(first).not.toContain("--resume");
    expect(second?.slice(-4)).toEqual([
      "--resume",
      cursorMadeUpSessionId,
      "--",
      "Again.",
    ]);
  });

  it("writes the instructions with the Cursor rule first", async () => {
    const chat = await startCursorChat();
    await chat.ask({ text: "Set the script to ready." });
    await chat.waitUntilIdle();

    const rule = await readFile(
      join(
        chat.project.projectFolder,
        ".yumekit",
        "agent-cursor",
        ".cursor",
        "rules",
        "yumekit.mdc",
      ),
      "utf8",
    );
    expect(rule).toMatch(
      /^---\nalwaysApply: true\n---\n\nUse only the yumekit tools\. Each other tool is off\./,
    );
  });

  it("gives agent-signed-out that tells the person to run cursor-agent login", async () => {
    const chat = await startCursorChat();
    await chat.writeScenario({ steps: [], signedIn: false });

    const asked = await chat.ask({ text: "Hello." });

    expect(asked.status).toBe(409);
    expect(JSON.parse(asked.body)).toEqual({
      kind: "agent-signed-out",
      message:
        "Cursor is not signed in. Open a terminal and run cursor-agent login. Then try again.",
    });
  });
});
