import { describe, expect, it } from "vitest";
import type { BrainEvent } from "../brainTypes.js";
import {
  cursorChangeStream,
  cursorInit,
  cursorMadeUpCallId,
  cursorMadeUpSessionId,
  cursorResult,
  cursorSuccess,
} from "../testing/cursorStreams.js";
import {
  createFakeProgram,
  type FakeScenario,
} from "../testing/fakeProgram.js";
import { createCursorAdapter } from "./cursorAdapter.js";

async function runCursor(options: {
  scenario: FakeScenario;
  stopAfterFirstEvent?: boolean;
}) {
  const fake = await createFakeProgram(options.scenario);
  const events: BrainEvent[] = [];
  const turn = createCursorAdapter({ programPath: fake.programPath }).startTurn(
    {
      request: "Set the script to the single word ready.",
      sessionId: undefined,
      instructions: "Answer in plain words.",
      serverCommand: { command: "/opt/node/bin/node", args: ["main.js"] },
      workingFolder: fake.workingFolder,
      onEvent: (event) => {
        events.push(event);
        if (options.stopAfterFirstEvent === true) turn.stop();
      },
    },
  );
  return { events, end: await turn.ended };
}

describe("the Cursor adapter", () => {
  it("turns a recorded stream into the session, the texts, the yumekit call only, and done with no cost", async () => {
    const { events, end } = await runCursor({
      scenario: { lines: cursorChangeStream(cursorSuccess) },
    });

    expect(events).toEqual([
      { type: "session", sessionId: cursorMadeUpSessionId },
      { type: "text", text: "I will", isPart: true },
      { type: "text", text: " set it.", isPart: true },
      { type: "text", text: "I will set it.", isPart: false },
      {
        type: "tool-started",
        callId: cursorMadeUpCallId,
        tool: "set_script",
        input: { script: "ready" },
      },
      { type: "tool-finished", callId: cursorMadeUpCallId, ok: true },
      { type: "text", text: " Done.", isPart: true },
      { type: "text", text: " Done.", isPart: false },
    ]);
    expect(end).toEqual({ kind: "done" });
  });

  it.each([
    ["a rejected call", { rejected: { reason: "User rejected MCP: no" } }],
    ["a call with an error", { success: { content: [], isError: true } }],
  ])("reports %s as not ok", async (...[, result]) => {
    const { events } = await runCursor({
      scenario: { lines: cursorChangeStream(result) },
    });

    expect(events).toContainEqual({
      type: "tool-finished",
      callId: cursorMadeUpCallId,
      ok: false,
    });
  });

  it("gives failed with the result text when the result is an error", async () => {
    const { end } = await runCursor({
      scenario: { lines: [cursorInit, cursorResult({ isError: true })] },
    });

    expect(end).toEqual({
      kind: "failed",
      reason: "program",
      message: "The model is busy.",
    });
  });

  it("gives failed with the last line of standard error when no result comes", async () => {
    const { end } = await runCursor({
      scenario: {
        lines: [cursorInit],
        errorLines: ["Connecting.", "The network is down.", ""],
        exitCode: 1,
      },
    });

    expect(end).toEqual({
      kind: "failed",
      reason: "program",
      message: "The network is down.",
    });
  });

  it("gives stopped when the adapter sent the signal and the program exits with 130 and no result", async () => {
    const { end } = await runCursor({
      scenario: {
        lines: [cursorInit],
        untilInterrupt: { lines: [], exitCode: 130 },
      },
      stopAfterFirstEvent: true,
    });

    expect(end).toEqual({ kind: "stopped" });
  });

  it("reads the sign-in state from isAuthenticated of status", async () => {
    const signedIn = await createFakeProgram({ lines: [], signedIn: true });
    expect(
      await createCursorAdapter({
        programPath: signedIn.programPath,
      }).signInState(),
    ).toBe("signed-in");
    const signedOut = await createFakeProgram({ lines: [], signedIn: false });
    expect(
      await createCursorAdapter({
        programPath: signedOut.programPath,
      }).signInState(),
    ).toBe("signed-out");
  });
});
