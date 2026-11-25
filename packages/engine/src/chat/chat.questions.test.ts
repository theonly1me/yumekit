import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { firstTextOf, savedResultOf } from "./testing/savedResult.js";
import {
  lastRequestTextOf,
  roundQuestions,
  startWithOpenRound,
} from "./testing/questionRound.js";

const allAnswers = [
  { question_id: "hero", choices: ["A young ferry hand"] },
  { question_id: "ending", choices: [], own_words: "The fog lifts at dawn." },
  { question_id: "look", choices: ["Painted", "Paper cut-out"] },
];

describe("questions in rounds", () => {
  it("stores the round of ask_person as an open questions entry, tells the lead to end its turn, and refuses each later call of that turn", async () => {
    const { chat, folder } = await startWithOpenRound();

    const asked = await savedResultOf(join(folder, "asked.json"));
    const after = await savedResultOf(join(folder, "after.json"));
    const { entries, state } = await chat.readChat();

    expect(asked.isError).toBe(false);
    expect(firstTextOf(asked)).toContain("End your turn now");
    expect(after.mcpResult.structuredContent).toMatchObject({
      kind: "questions-waiting",
    });
    expect(state).toBe("idle");
    expect(entries.map((entry) => entry.kind)).toEqual([
      "request",
      "answer",
      "questions",
    ]);
    expect(entries[1]).toMatchObject({ state: "done" });
    expect(entries[2]).toMatchObject({
      state: "open",
      answers: [],
      questions: [
        { ...roundQuestions[0], multiple: false },
        { ...roundQuestions[1], multiple: false },
        roundQuestions[2],
      ],
    });
  });

  it("starts a turn from the answers route with each question and its answer, and closes the round", async () => {
    const { chat, roundId } = await startWithOpenRound();

    const sent = await chat.post({
      path: "/api/chat/answers",
      body: { round_id: roundId, answers: allAnswers },
    });
    const { entries } = await chat.waitUntilIdle();
    const requestText = await lastRequestTextOf(chat);

    expect(sent.status).toBe(202);
    expect(JSON.parse(sent.body)).toMatchObject({
      kind: "request",
      text: "",
      roundId,
    });
    expect(entries.find((entry) => entry.id === roundId)).toMatchObject({
      state: "closed",
      answers: [
        { questionId: "hero", choices: ["A young ferry hand"], ownWords: "" },
        {
          questionId: "ending",
          choices: [],
          ownWords: "The fog lifts at dawn.",
        },
        { questionId: "look", choices: ["Painted", "Paper cut-out"] },
      ],
    });
    expect(requestText).toBe(
      [
        "The person answered your 3 questions:",
        "1. Who carries the bell across?",
        "Answer: A young ferry hand",
        "2. How does it end?",
        "Answer: In their own words: The fog lifts at dawn.",
        "3. Which looks fit?",
        "Answer: Painted; Paper cut-out",
      ].join("\n"),
    );
  });

  it("sends a message of the box with the answers so far, names each question with no answer, and closes the round", async () => {
    const { chat, roundId } = await startWithOpenRound();

    const sent = await chat.post({
      path: "/api/chat/answers",
      body: {
        round_id: roundId,
        answers: [allAnswers[0]],
        text: "Keep it under two minutes.",
      },
    });
    const { entries } = await chat.waitUntilIdle();
    const requestText = await lastRequestTextOf(chat);

    expect(sent.status).toBe(202);
    expect(requestText).toContain("Keep it under two minutes.");
    expect(requestText).toContain(
      "The person answered 1 of your 3 questions. A question with no answer is still open:",
    );
    expect(requestText).toContain(
      "2. How does it end?\nNo answer.\n3. Which looks fit?\nNo answer.",
    );
    expect(entries.find((entry) => entry.id === roundId)).toMatchObject({
      state: "closed",
    });
  });

  it("closes an open round on a plain request too, and names its questions as open", async () => {
    const { chat, roundId } = await startWithOpenRound();

    await chat.ask({ text: "Just make it." });
    const { entries } = await chat.waitUntilIdle();
    const requestText = await lastRequestTextOf(chat);

    expect(requestText).toContain("Just make it.");
    expect(requestText).toContain(
      "The person did not answer your 3 questions. Each one is still open:",
    );
    expect(entries.find((entry) => entry.id === roundId)).toMatchObject({
      state: "closed",
      answers: [],
    });
  });

  it("refuses answers to a closed round, and answers that do not match the round", async () => {
    const { chat, roundId } = await startWithOpenRound();

    const notAnOption = await chat.post({
      path: "/api/chat/answers",
      body: {
        round_id: roundId,
        answers: [{ question_id: "hero", choices: ["A dragon"] }],
      },
    });
    const twoForOne = await chat.post({
      path: "/api/chat/answers",
      body: {
        round_id: roundId,
        answers: [
          { question_id: "ending", choices: roundQuestions[1]?.options },
        ],
      },
    });
    await chat.post({
      path: "/api/chat/answers",
      body: { round_id: roundId, answers: allAnswers },
    });
    await chat.waitUntilIdle();
    const again = await chat.post({
      path: "/api/chat/answers",
      body: { round_id: roundId, answers: allAnswers },
    });

    expect(notAnOption.status).toBe(400);
    expect(JSON.parse(notAnOption.body)).toMatchObject({
      kind: "answers-not-valid",
    });
    expect(twoForOne.status).toBe(400);
    expect(again.status).toBe(409);
    expect(JSON.parse(again.body)).toMatchObject({ kind: "questions-closed" });
    expect(await chat.runs()).toHaveLength(2);
  });

  it("refuses ask_person outside a chat request of the lead", async () => {
    const { chat } = await startWithOpenRound();

    const asked = await callTool({
      ...chat.engine,
      name: "ask_person",
      input: { questions: roundQuestions },
    });

    expect(JSON.parse(asked.body)).toMatchObject({
      isError: true,
      data: { kind: "no-chat-request" },
    });
  });
});
