import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult, successResult } from "../results.js";
import {
  noPersonFailure,
  type AskPerson,
  type PersonQuestion,
} from "./questionTypes.js";

export const endTurnLine =
  "The questions are on a card in the chat. End your turn now with one short sentence, and ask nothing in your text. The answers come as the next request.";

const questionInput = z.object({
  id: idInput("The id of the question, unique in this round, for example q1."),
  text: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .describe("The question in one short plain sentence."),
  options: z
    .array(z.string().trim().min(1).max(80))
    .min(2)
    .max(6)
    .describe(
      "2 to 6 short answers to pick from, a few words each. The person can always give their own words instead.",
    ),
  multiple: z
    .boolean()
    .optional()
    .describe(
      "True when the person may pick more than one option. False by default.",
    ),
});

function repeatOf(values: string[]): string | undefined {
  return values.find((...[value, index]) => values.indexOf(value) !== index);
}

function repeatFailureOf(questions: PersonQuestion[]) {
  const repeatedId = repeatOf(questions.map((question) => question.id));
  if (repeatedId !== undefined) {
    return {
      kind: "question-id-repeated",
      message: `Two questions have the id ${repeatedId}.`,
      hint: "Give each question of the round its own id.",
    };
  }
  const repeated = questions.find(
    (question) => repeatOf(question.options) !== undefined,
  );
  return repeated === undefined
    ? undefined
    : {
        kind: "option-repeated",
        message: `The question ${repeated.id} has the same option twice.`,
        hint: "Give each option of a question once.",
      };
}

export function registerAskPerson(
  context: HarnessContext & { askPerson: AskPerson | undefined },
): void {
  context.tools.add({
    name: "ask_person",
    description:
      "Ask the person multiple-choice questions in one round. The editor shows the round as one card above the chat box: one question at a time, the options as chips, a line for the person's own words, Back, and Next. Ask when the request leaves open a choice that changes the film, such as the story, the characters, the length, or the look. Ask 3 to 6 short questions in a round, each with 2 to 6 short options. After this call, end your turn at once: the answers come as the next request. You may ask another round after you discuss the answers.",
    inputSchema: {
      questions: z
        .array(questionInput)
        .min(1)
        .max(20)
        .describe("The questions of this round, in order. 1 to 20."),
    },
    run: async ({ input }) => {
      if (context.askPerson === undefined)
        return failureResult(noPersonFailure);
      const questions = input.questions.map((question) => ({
        id: question.id,
        text: question.text,
        options: question.options,
        multiple: question.multiple ?? false,
      }));
      const repeated = repeatFailureOf(questions);
      if (repeated !== undefined) return failureResult(repeated);
      const asked = await context.askPerson(questions);
      if (!asked.ok) return failureResult(asked.failure);
      return successResult({
        line: endTurnLine,
        data: {
          round_id: asked.roundId,
          question_count: questions.length,
          next: endTurnLine,
        },
      });
    },
  });
}
