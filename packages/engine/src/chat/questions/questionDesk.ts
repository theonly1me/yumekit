import { randomUUID } from "node:crypto";
import {
  harnessFailureResult,
  type HarnessResult,
  type PersonQuestion,
} from "@yumekit/harness-mcp";
import type { ChatLog } from "../chatLog.js";
import type { ChatEntry } from "../chatTypes.js";
import type { PersonAnswer, QuestionsEntry } from "./questionSchemas.js";

export interface QuestionDesk {
  open: (questions: PersonQuestion[]) => QuestionsEntry;
  openRound: () => QuestionsEntry | undefined;
  close: (options: { round: QuestionsEntry; answers: PersonAnswer[] }) => void;
}

export const questionsWaitingResult: HarnessResult = harnessFailureResult({
  kind: "questions-waiting",
  message:
    "You asked the person questions, so this call did not run. The person has not answered yet.",
  hint: "End your turn now with one short sentence. The answers come as the next request.",
});

function isOpenRound(entry: ChatEntry): entry is QuestionsEntry {
  return entry.kind === "questions" && entry.state === "open";
}

export function createQuestionDesk(log: ChatLog): QuestionDesk {
  return {
    open: (questions) => {
      const round: QuestionsEntry = {
        kind: "questions",
        id: randomUUID(),
        questions,
        state: "open",
        answers: [],
      };
      log.put(round);
      return round;
    },
    openRound: () => log.entries().findLast(isOpenRound),
    close: ({ round, answers }) => {
      log.put({ ...round, state: "closed", answers });
    },
  };
}
