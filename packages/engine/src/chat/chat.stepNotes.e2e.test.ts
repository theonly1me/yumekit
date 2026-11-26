import { describe, expect, it } from "vitest";
import { init, result, toolResult, toolUse } from "./testing/claudeLines.js";
import { startChatEngine, type FakeStep } from "./testing/chatEngine.js";
import { createAnswerTracker } from "./answerTracker.js";
import type { AnswerEntry } from "./chatTypes.js";

const musicInput = {
  asset_id: "music",
  capability: "music",
  server: "nope",
  input: { prompt: "calm piano", duration_seconds: 15 },
};

const failedMusicRequest: FakeStep[] = [
  { print: init },
  {
    print: toolUse({
      callId: "call-1",
      tool: "generate_asset",
      input: musicInput,
    }),
  },
  { callTool: { name: "generate_asset", input: musicInput } },
  { print: toolResult({ callId: "call-1", isError: true }) },
  { print: result("completed") },
];

describe("the steps of an answer", () => {
  it("keep the capability of a call and the plain reason of a failed call", async () => {
    const chat = await startChatEngine({ steps: failedMusicRequest });

    await chat.ask({ text: "Add music." });
    const { entries } = await chat.waitUntilIdle();

    expect(entries.find((entry) => entry.kind === "answer")).toMatchObject({
      steps: [
        {
          callId: "call-1",
          tool: "generate_asset",
          state: "failed",
          capability: "music",
          reason: 'No media server is named "nope".',
        },
      ],
    });
  });

  it("keep the progress of a running call, write it again only when the percent changes, and drop it when the call ends", () => {
    const written: AnswerEntry[] = [];
    const tracker = createAnswerTracker({
      log: {
        put: (entry) => {
          if (entry.kind === "answer") written.push(entry);
        },
        entries: () => [],
        sendText: () => undefined,
        sessionId: () => undefined,
        setSessionId: () => undefined,
        pushRedo: () => undefined,
        popRedo: () => undefined,
        clearRedo: () => undefined,
        flush: () => Promise.resolve(),
      },
      answer: {
        kind: "answer",
        id: "a",
        text: "",
        state: "running",
        steps: [],
      },
    });
    tracker.onEvent({
      type: "tool-started",
      callId: "c",
      tool: "generate_asset",
      input: { capability: "speech" },
    });
    const note = tracker.noteCall("generate_asset");
    const message = "Getting the natural voice, one time, 148 MB";

    note.onProgress({ done: 4_000_000, total: 148_000_000, message });
    note.onProgress({ done: 4_100_000, total: 148_000_000, message });
    note.onProgress({ done: 74_000_000, total: 148_000_000, message });
    const whileRunning = written.at(-1)?.steps;
    note.finish(undefined);

    expect(written).toHaveLength(4);
    expect(whileRunning).toEqual([
      {
        callId: "c",
        tool: "generate_asset",
        state: "running",
        capability: "speech",
        progress: { done: 74_000_000, total: 148_000_000, message },
      },
    ]);
    expect(written.at(-1)?.steps).toEqual([
      {
        callId: "c",
        tool: "generate_asset",
        state: "running",
        capability: "speech",
      },
    ]);
  });
});
