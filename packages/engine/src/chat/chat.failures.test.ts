import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createTestProject,
  startTestEngine,
} from "../testing/engineFixture.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { init, part, result } from "./testing/claudeLines.js";
import { startChatEngine } from "./testing/chatEngine.js";

const runsUntilStopped = {
  steps: [
    { print: init },
    { print: part("Working") },
    { waitForStop: { print: [result("aborted_streaming")] } },
  ],
};

function failureOf(body: string): unknown {
  const value: unknown = JSON.parse(body);
  return value;
}

describe("the failures and the stop of a chat request", () => {
  it("stop ends a request that runs as stopped", async () => {
    const chat = await startChatEngine(runsUntilStopped);
    await chat.ask({ text: "Make a long video." });
    await chat.events.waitFor(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        Reflect.get(message, "type") === "chat-text",
    );

    expect((await chat.readChat()).state).toBe("running");

    const stopped = await chat.post({ path: "/api/chat/stop" });
    expect(JSON.parse(stopped.body)).toEqual({ stopped: true });
    const { entries } = await chat.waitUntilIdle();
    expect(entries.at(-1)).toMatchObject({
      kind: "answer",
      state: "stopped",
      text: "Working",
    });
  });

  it("stops the running request when the engine closes", async () => {
    const chat = await startChatEngine(runsUntilStopped);
    await chat.ask({ text: "Make a long video." });
    await chat.events.waitFor(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        Reflect.get(message, "type") === "chat-text",
    );

    await chat.engine.close();

    const answerStates = chat.events.messages.flatMap((message) => {
      const entry: unknown =
        typeof message === "object" && message !== null
          ? Reflect.get(message, "entry")
          : undefined;
      return typeof entry === "object" && entry !== null
        ? [String(Reflect.get(entry, "state"))]
        : [];
    });
    expect(answerStates.at(-1)).toBe("stopped");
  });

  it("gives agent-signed-out with the steps to sign in", async () => {
    const chat = await startChatEngine({ steps: [], signedIn: false });

    const asked = await chat.ask({ text: "Hello." });

    expect(asked.status).toBe(409);
    expect(failureOf(asked.body)).toEqual({
      kind: "agent-signed-out",
      message:
        "Claude Code is not signed in. Open a terminal, run claude once, and sign in. Then try again.",
    });
    expect((await chat.readChat()).entries).toEqual([]);
  });

  it("gives no-agent when no agent program is on the path", async () => {
    const project = await createTestProject();
    const emptyFolder = join(project.root, "empty");
    await mkdir(emptyFolder);
    vi.stubEnv("PATH", emptyFolder);
    const engine = await startTestEngine({
      projectFolder: project.projectFolder,
      serverCommand: { command: "/bin/false", args: [] },
    });

    const asked = await rawRequest({
      port: engine.port,
      path: "/api/chat/requests",
      method: "POST",
      headers: withToken(engine),
      body: JSON.stringify({ text: "Hello." }),
    });

    expect(asked.status).toBe(409);
    expect(failureOf(asked.body)).toEqual({
      kind: "no-agent",
      message:
        "No AI program is on this computer. Install Claude Code, Codex, or Cursor, start it once in a terminal, and sign in.",
    });
    const view = await rawRequest({
      port: engine.port,
      path: "/api/chat",
      headers: withToken(engine),
    });
    expect(JSON.parse(view.body)).toEqual({
      agent: null,
      state: "idle",
      entries: [],
    });
  });

  it("gives settings-not-valid for a settings file that is not valid", async () => {
    const chat = await startChatEngine({ steps: [] });
    await writeFile(
      join(chat.project.configurationDirectory, "settings.json"),
      JSON.stringify({ agent: "someone-else" }),
    );

    const asked = await chat.ask({ text: "Hello." });

    expect(asked.status).toBe(409);
    expect(failureOf(asked.body)).toMatchObject({ kind: "settings-not-valid" });
  });
});
