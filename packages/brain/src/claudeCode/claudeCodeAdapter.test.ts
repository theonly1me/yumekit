import { describe, expect, it } from "vitest";
import type { BrainEvent } from "../brainTypes.js";
import {
  claudeChangeStream,
  claudeDelta,
  claudeInit,
  claudeMadeUpSessionId,
  claudeResult,
  claudeSignedOutStream,
} from "../testing/claudeStreams.js";
import {
  createFakeProgram,
  type FakeScenario,
} from "../testing/fakeProgram.js";
import { createClaudeCodeAdapter } from "./claudeCodeAdapter.js";

const serverCommand = {
  command: "/opt/node/bin/node",
  args: ["/opt/yumekit/main.js", "mcp", "--project", "/work/my project"],
};

async function runClaude(options: {
  scenario: FakeScenario;
  request?: string;
  sessionId?: string;
  stopAfterFirstEvent?: boolean;
}) {
  const fake = await createFakeProgram(options.scenario);
  const adapter = createClaudeCodeAdapter({ programPath: fake.programPath });
  const events: BrainEvent[] = [];
  const turn = adapter.startTurn({
    request: options.request ?? "Set the script to the single word ready.",
    sessionId: options.sessionId,
    instructions: "Answer in plain words.",
    serverCommand,
    workingFolder: fake.workingFolder,
    onEvent: (event) => {
      events.push(event);
      if (options.stopAfterFirstEvent === true) turn.stop();
    },
  });
  const end = await turn.ended;
  return { events, end, fake, adapter };
}

describe("the Claude Code adapter", () => {
  it("turns a recorded stream into the session, the texts, the tool call, and the end with the cost", async () => {
    const { events, end } = await runClaude({
      scenario: { lines: claudeChangeStream },
    });

    expect(events).toEqual([
      { type: "session", sessionId: claudeMadeUpSessionId },
      { type: "text", text: "I will set ", isPart: true },
      { type: "text", text: "the script.", isPart: true },
      { type: "text", text: "I will set the script.", isPart: false },
      {
        type: "tool-started",
        callId: "toolu_made_up_1",
        tool: "set_script",
        input: { text: "ready" },
      },
      { type: "tool-finished", callId: "toolu_made_up_1", ok: true },
      { type: "text", text: "The script now says ready.", isPart: false },
    ]);
    expect(end).toEqual({ kind: "done", costUsd: 0.0125 });
  });

  it("passes the request as one argument after the flags that permit only the yumekit tools", async () => {
    const request = 'Say "hi"; $(touch /tmp/x) && rm -rf ~ `id`';
    const { fake } = await runClaude({
      scenario: { lines: claudeChangeStream },
      request,
      sessionId: "earlier-session",
    });

    const run = await fake.readRun();
    expect(run.arguments.at(-1)).toBe(request);
    expect(run.arguments.at(-2)).toBe("--");
    expect(run.folder).toContain("work");
    const valueOf = (flag: string) =>
      run.arguments[run.arguments.indexOf(flag) + 1];
    expect(valueOf("--tools")).toBe("");
    expect(valueOf("--allowedTools")).toBe("mcp__yumekit__*");
    expect(valueOf("--permission-mode")).toBe("dontAsk");
    expect(valueOf("--setting-sources")).toBe("");
    expect(valueOf("--resume")).toBe("earlier-session");
    expect(run.arguments).toContain("--strict-mcp-config");
    expect(JSON.parse(valueOf("--mcp-config") ?? "")).toEqual({
      mcpServers: { yumekit: { type: "stdio", ...serverCommand } },
    });
  });

  it("gives stopped when the person stops the request", async () => {
    const { end } = await runClaude({
      scenario: {
        lines: [claudeInit("connected"), claudeDelta("Working")],
        untilInterrupt: {
          lines: [
            claudeResult({
              isError: true,
              terminalReason: "aborted_streaming",
              result: "",
            }),
          ],
          exitCode: 0,
        },
      },
      stopAfterFirstEvent: true,
    });

    expect(end).toEqual({ kind: "stopped" });
  });

  it("gives signed-out when the program has no sign-in", async () => {
    const { end } = await runClaude({
      scenario: { lines: claudeSignedOutStream, exitCode: 1 },
    });

    expect(end).toMatchObject({ kind: "failed", reason: "signed-out" });
  });

  it("ends the turn as tools when the yumekit server did not connect", async () => {
    const { end } = await runClaude({
      scenario: {
        lines: [claudeInit("failed")],
        untilInterrupt: { lines: [], exitCode: 0 },
      },
    });

    expect(end).toMatchObject({ kind: "failed", reason: "tools" });
  });

  it("gives program when the program exits with no result", async () => {
    const { end } = await runClaude({
      scenario: { lines: [claudeInit("connected")], exitCode: 1 },
    });

    expect(end).toMatchObject({ kind: "failed", reason: "program" });
  });

  it("reads the sign-in state from auth status", async () => {
    const signedIn = await createFakeProgram({ lines: [], signedIn: true });
    expect(
      await createClaudeCodeAdapter({
        programPath: signedIn.programPath,
      }).signInState(),
    ).toBe("signed-in");

    const signedOut = await createFakeProgram({ lines: [], signedIn: false });
    expect(
      await createClaudeCodeAdapter({
        programPath: signedOut.programPath,
      }).signInState(),
    ).toBe("signed-out");
  });
});
