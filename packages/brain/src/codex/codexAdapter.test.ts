import { describe, expect, it } from "vitest";
import type { BrainEvent } from "../brainTypes.js";
import {
  codexFailedStream,
  codexMadeUpThreadId,
  codexNestedFailureStream,
  codexStart,
  codexToolStream,
} from "../testing/codexStreams.js";
import {
  createFakeProgram,
  type FakeScenario,
} from "../testing/fakeProgram.js";
import { createCodexAdapter } from "./codexAdapter.js";

const serverCommand = {
  command: "/opt/node/bin/node",
  args: ["/opt/yumekit/main.js", "mcp", "--project", "/work/my project"],
};

async function runCodex(options: {
  scenario: FakeScenario;
  sessionId?: string;
  stopAfterFirstEvent?: boolean;
}) {
  const fake = await createFakeProgram(options.scenario);
  const events: BrainEvent[] = [];
  const turn = createCodexAdapter({ programPath: fake.programPath }).startTurn({
    request: "-Set the script to ready.",
    sessionId: options.sessionId,
    instructions: 'Line one.\nSay "plain" words.',
    serverCommand,
    workingFolder: fake.workingFolder,
    onEvent: (event) => {
      events.push(event);
      if (options.stopAfterFirstEvent === true) turn.stop();
    },
  });
  const end = await turn.ended;
  return { events, end, fake };
}

describe("the Codex adapter", () => {
  it("turns a recorded stream into the session, the whole texts, the tool call, and done", async () => {
    const { events, end } = await runCodex({
      scenario: {
        lines: codexToolStream({ status: "completed", error: null }),
      },
    });

    expect(events).toEqual([
      { type: "session", sessionId: codexMadeUpThreadId },
      { type: "text", text: "I will set it.", isPart: false },
      {
        type: "tool-started",
        callId: "item_1",
        tool: "set_script",
        input: { text: "ready" },
      },
      { type: "tool-finished", callId: "item_1", ok: true },
      { type: "text", text: "It says ready.", isPart: false },
    ]);
    expect(end).toEqual({ kind: "done" });
  });

  it("reports a tool call with an error as not ok", async () => {
    const { events } = await runCodex({
      scenario: {
        lines: codexToolStream({
          status: "failed",
          error: { message: "no such scene" },
        }),
      },
    });

    expect(events).toContainEqual({
      type: "tool-finished",
      callId: "item_1",
      ok: false,
    });
  });

  it("builds the flags of a first request and of a resume, with the request as the last argument", async () => {
    const first = await runCodex({
      scenario: {
        lines: codexToolStream({ status: "completed", error: null }),
      },
    });
    const firstRun = await first.fake.readRun();
    expect(firstRun.arguments.slice(0, 3)).toEqual([
      "exec",
      "--json",
      "--skip-git-repo-check",
    ]);
    expect(firstRun.arguments).toContain("--ignore-user-config");
    expect(firstRun.arguments.join(" ")).toContain(
      "--disable apps --disable plugins --disable shell_tool --sandbox read-only",
    );
    expect(firstRun.arguments).toContain(
      'mcp_servers.yumekit.args=["/opt/yumekit/main.js","mcp","--project","/work/my project"]',
    );
    expect(firstRun.arguments).toContain(
      'developer_instructions="Line one.\\nSay \\"plain\\" words."',
    );
    expect(firstRun.arguments.slice(-2)).toEqual([
      "--",
      "-Set the script to ready.",
    ]);

    const resumed = await runCodex({
      scenario: {
        lines: codexToolStream({ status: "completed", error: null }),
      },
      sessionId: codexMadeUpThreadId,
    });
    const resumedRun = await resumed.fake.readRun();
    expect(resumedRun.arguments.slice(0, 2)).toEqual(["exec", "resume"]);
    expect(resumedRun.arguments).not.toContain("--sandbox");
    expect(resumedRun.arguments).toContain('sandbox_mode="read-only"');
    expect(resumedRun.arguments.slice(-3)).toEqual([
      "--",
      codexMadeUpThreadId,
      "-Set the script to ready.",
    ]);
  });

  it("gives failed with the message of turn.failed", async () => {
    const { end } = await runCodex({
      scenario: { lines: codexFailedStream, exitCode: 1 },
    });

    expect(end).toEqual({
      kind: "failed",
      reason: "program",
      message: "The model is busy.",
    });
  });

  it("takes the inner message of a failure that holds a JSON error", async () => {
    const { end } = await runCodex({
      scenario: { lines: codexNestedFailureStream, exitCode: 1 },
    });

    expect(end).toMatchObject({ message: "The model is gone." });
  });

  it("gives stopped when the adapter sent the signal and the program exits with 1 and no end", async () => {
    const { end } = await runCodex({
      scenario: {
        lines: codexStart,
        untilInterrupt: { lines: [], exitCode: 1 },
      },
      stopAfterFirstEvent: true,
    });

    expect(end).toEqual({ kind: "stopped" });
  });

  it("reads the sign-in state from the exit code of login status", async () => {
    const signedIn = await createFakeProgram({ lines: [], signedIn: true });
    expect(
      await createCodexAdapter({
        programPath: signedIn.programPath,
      }).signInState(),
    ).toBe("signed-in");
    const signedOut = await createFakeProgram({ lines: [], signedIn: false });
    expect(
      await createCodexAdapter({
        programPath: signedOut.programPath,
      }).signInState(),
    ).toBe("signed-out");
  });
});
