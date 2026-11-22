import { randomUUID } from "node:crypto";
import {
  brainInstructions,
  type AgentAdapter,
  type ServerCommand,
  type Turn,
  type TurnEnd,
} from "@yumekit/brain";
import { agentCatalog } from "../agents/agentCatalog.js";
import { createAnswerTracker } from "./answerTracker.js";
import type { ChangeLedger } from "./changeLedger.js";
import type { ChatLog } from "./chatLog.js";
import type { AnswerEntry } from "./chatTypes.js";

export const newConversationNotice = "The AI started a new conversation.";
export const aiChangedSummary = "The AI changed the project.";

export function signInMessageOf(adapter: AgentAdapter): string {
  const { program } = agentCatalog[adapter.id];
  return `${adapter.name} is not signed in. Open a terminal, run ${program} once, and sign in. Then try again.`;
}

function noticeOf(options: {
  end: Extract<TurnEnd, { kind: "failed" }>;
  adapter: AgentAdapter;
}): string {
  switch (options.end.reason) {
    case "signed-out":
      return signInMessageOf(options.adapter);
    case "tools":
      return "The AI could not open this project. Close the editor, open it again, and try again.";
    case "program":
      return `The AI stopped with a problem: ${options.end.message}`;
  }
}

function answerStateOf(end: TurnEnd): AnswerEntry["state"] {
  return end.kind === "failed" ? "failed" : end.kind;
}

export interface RequestRun {
  adapter: AgentAdapter;
  log: ChatLog;
  ledger: ChangeLedger;
  requestText: string;
  answer: AnswerEntry;
  serverCommand: ServerCommand;
  workingFolder: string;
  onTurn: (turn: Turn) => void;
  isStopRequested: () => boolean;
}

async function runAttempt(options: {
  run: RequestRun;
  tracker: ReturnType<typeof createAnswerTracker>;
}): Promise<{ end: TurnEnd; sawSession: boolean }> {
  const { run, tracker } = options;
  let sawSession = false;
  const turn = run.adapter.startTurn({
    request: run.requestText,
    sessionId: run.log.sessionId(),
    instructions: brainInstructions,
    serverCommand: run.serverCommand,
    workingFolder: run.workingFolder,
    onEvent: (event) => {
      if (event.type === "session") sawSession = true;
      tracker.onEvent(event);
    },
  });
  run.onTurn(turn);
  return { end: await turn.ended, sawSession };
}

export async function runRequest(run: RequestRun): Promise<void> {
  const { log, ledger } = run;
  ledger.beginRequest();
  const tracker = createAnswerTracker({ log, answer: run.answer });
  const resumed = run.log.sessionId() !== undefined;
  let attempt = await runAttempt({ run, tracker });
  const isResumeFailure =
    resumed &&
    !attempt.sawSession &&
    !run.isStopRequested() &&
    attempt.end.kind === "failed" &&
    attempt.end.reason === "program";
  if (isResumeFailure) {
    log.put({ kind: "notice", id: randomUUID(), text: newConversationNotice });
    log.setSessionId(undefined);
    attempt = await runAttempt({ run, tracker });
  }
  const { end } = attempt;
  tracker.finish(answerStateOf(end));
  if (end.kind === "failed") {
    log.put({
      kind: "notice",
      id: randomUUID(),
      text: noticeOf({ end, adapter: run.adapter }),
    });
  }
  const sentence = tracker.lastSentence();
  ledger.endRequest(sentence === "" ? aiChangedSummary : sentence);
}
