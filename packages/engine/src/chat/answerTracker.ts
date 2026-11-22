import type { BrainEvent } from "@yumekit/brain";
import type { ChatLog } from "./chatLog.js";
import type { AnswerEntry } from "./chatTypes.js";

export const textIntervalMilliseconds = 100;

const summaryLimit = 140;

export interface AnswerTracker {
  onEvent: (event: BrainEvent) => void;
  finish: (state: AnswerEntry["state"]) => void;
  lastSentence: () => string;
}

export function lastSentenceOf(text: string): string {
  const sentences = text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
  return (sentences.at(-1) ?? "").slice(0, summaryLimit);
}

export function createAnswerTracker(options: {
  log: ChatLog;
  answer: AnswerEntry;
}): AnswerTracker {
  const { log } = options;
  let answer = options.answer;
  const wholeTexts: string[] = [];
  let partText = "";
  let lastSentAt = 0;
  let trailingSend: NodeJS.Timeout | undefined;
  const fullText = () =>
    [...wholeTexts, partText].filter((text) => text !== "").join("\n\n");
  const sendText = () => {
    trailingSend = undefined;
    lastSentAt = Date.now();
    log.sendText({ id: answer.id, text: fullText() });
  };
  const sendTextSoon = () => {
    const wait = lastSentAt + textIntervalMilliseconds - Date.now();
    if (wait <= 0) sendText();
    else trailingSend ??= setTimeout(sendText, wait);
  };
  const put = (next: AnswerEntry) => {
    answer = next;
    log.put(answer);
  };
  return {
    onEvent: (event) => {
      switch (event.type) {
        case "session":
          log.setSessionId(event.sessionId);
          return;
        case "text":
          if (event.isPart) {
            partText += event.text;
            sendTextSoon();
            return;
          }
          partText = "";
          wholeTexts.push(event.text);
          put({ ...answer, text: fullText() });
          return;
        case "tool-started":
          put({
            ...answer,
            steps: [
              ...answer.steps,
              { callId: event.callId, tool: event.tool, state: "running" },
            ],
          });
          return;
        case "tool-finished":
          put({
            ...answer,
            steps: answer.steps.map((step) =>
              step.callId === event.callId
                ? { ...step, state: event.ok ? "done" : "failed" }
                : step,
            ),
          });
          return;
      }
    },
    finish: (state) => {
      clearTimeout(trailingSend);
      trailingSend = undefined;
      put({ ...answer, text: fullText(), state });
    },
    lastSentence: () => lastSentenceOf(fullText()),
  };
}
