import { describe, expect, it } from "vitest";
import type { Snapshot } from "../engine/snapshot.js";
import { firstChatOf, type AnswerEntry, type ChatEntry } from "./firstChat.js";
import { makingStepsOf } from "./makingSteps.js";

const emptySnapshot: Snapshot = {
  revision: 1,
  project: { name: "Tea", framesPerSecond: 30, outputs: [] },
  script: "",
  bible: { cast: [] },
  scenes: [],
  sceneCode: {},
  timelines: [],
  assets: [],
};

const planRequest =
  "Tea\nPlatforms: TikTok.\nLength: 15 seconds.\nStop after the script and the pictures of each scene, drawn by code. Make no voice, no music, and no paid clip yet. Ask me to continue.";

function answerOf(options: {
  id: string;
  state: AnswerEntry["state"];
  tools: string[];
}): AnswerEntry {
  return {
    kind: "answer",
    id: options.id,
    state: options.state,
    steps: options.tools.map((tool) => ({ tool, state: "done" as const })),
  };
}

const planAnswer = answerOf({
  id: "plan",
  state: "done",
  tools: ["set_script", "put_scene", "put_scene", "set_timeline"],
});

function stepLinesOf(entries: ChatEntry[]): string[] {
  const chat = firstChatOf(entries);
  if (chat.answer === undefined) throw new Error("The chat has no answer.");
  return makingStepsOf({
    answer: chat.answer,
    snapshot: emptySnapshot,
    phase: chat.phase,
  }).map((step) => `${step.state} ${step.fact}`);
}

describe("the steps of the Making screen with the plan first", () => {
  it("shows Voice, Music, and Put it together as waiting for Continue when the plan is ready, not as skipped", () => {
    const lines = stepLinesOf([
      { kind: "request", id: "first", text: planRequest },
      planAnswer,
    ]);

    expect(lines).toEqual([
      "done The script is ready",
      "done 2 pictures are ready",
      "waiting Waits for Continue",
      "waiting Waits for Continue",
      "waiting Waits for Continue",
    ]);
  });

  it("keeps the steps of the plan and follows the answer to Continue until the video is ready", () => {
    const continueRequest = {
      kind: "request" as const,
      id: "second",
      text: "The plan is good. Make the rest of the video.",
    };
    const running = stepLinesOf([
      { kind: "request", id: "first", text: planRequest },
      planAnswer,
      continueRequest,
      answerOf({ id: "rest", state: "running", tools: [] }),
    ]);
    const finished = stepLinesOf([
      { kind: "request", id: "first", text: planRequest },
      planAnswer,
      continueRequest,
      answerOf({ id: "rest", state: "done", tools: ["place_narration"] }),
    ]);

    expect(running).toEqual([
      "done The script is ready",
      "done 2 pictures are ready",
      "now Working",
      "waiting ",
      "waiting ",
    ]);
    expect(finished).toEqual([
      "done The script is ready",
      "done 2 pictures are ready",
      "done The voice is ready",
      "skipped Skipped",
      "done The video is ready",
    ]);
  });

  it("treats a first request without the stop sentence as one whole request", () => {
    const lines = stepLinesOf([
      { kind: "request", id: "first", text: "Tea\nPlatforms: TikTok." },
      planAnswer,
    ]);

    expect(lines.at(-1)).toBe("done The video is ready");
    expect(lines.slice(2, 4)).toEqual(["skipped Skipped", "skipped Skipped"]);
  });
});
