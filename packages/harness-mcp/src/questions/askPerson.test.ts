import { describe, expect, it, onTestFinished } from "vitest";
import { createHarness, type PersonQuestion } from "../index.js";
import { startHarnessProject } from "../testing/harnessProject.js";

const lengthQuestion = {
  id: "length",
  text: "How long is the film?",
  options: ["About 1 minute", "About 3 minutes"],
};

async function harnessThatAsks() {
  const { store, mediaTools } = await startHarnessProject();
  const rounds: PersonQuestion[][] = [];
  const harness = createHarness({
    store,
    mediaTools,
    askPerson: (questions) => {
      rounds.push(questions);
      return Promise.resolve({ ok: true, roundId: "round-1" });
    },
  });
  onTestFinished(() => harness.close());
  return { harness, rounds };
}

describe("ask_person", () => {
  it("hands the round to the chat with single choice as the default, and tells the lead to end its turn", async () => {
    const { harness, rounds } = await harnessThatAsks();

    const asked = await harness.call({
      name: "ask_person",
      input: {
        questions: [
          lengthQuestion,
          {
            id: "look",
            text: "Which looks?",
            options: ["A", "B"],
            multiple: true,
          },
        ],
      },
    });

    expect(asked.isError).toBe(false);
    expect(asked.data).toMatchObject({
      round_id: "round-1",
      question_count: 2,
    });
    expect(asked.text).toContain("End your turn now");
    expect(rounds).toEqual([
      [
        { ...lengthQuestion, multiple: false },
        {
          id: "look",
          text: "Which looks?",
          options: ["A", "B"],
          multiple: true,
        },
      ],
    ]);
  });

  it("refuses a round with a repeated question id or a repeated option, and asks nothing", async () => {
    const { harness, rounds } = await harnessThatAsks();

    const twoIds = await harness.call({
      name: "ask_person",
      input: { questions: [lengthQuestion, lengthQuestion] },
    });
    const twoOptions = await harness.call({
      name: "ask_person",
      input: {
        questions: [{ ...lengthQuestion, options: ["Short", "Short"] }],
      },
    });

    expect(twoIds.data).toMatchObject({ kind: "question-id-repeated" });
    expect(twoOptions.data).toMatchObject({ kind: "option-repeated" });
    expect(rounds).toEqual([]);
  });

  it("fails with no-chat-request when no chat of the editor runs", async () => {
    const { store, mediaTools } = await startHarnessProject();
    const harness = createHarness({ store, mediaTools });
    onTestFinished(() => harness.close());

    const asked = await harness.call({
      name: "ask_person",
      input: { questions: [lengthQuestion] },
    });

    expect(asked.isError).toBe(true);
    expect(asked.data).toMatchObject({ kind: "no-chat-request" });
  });
});
