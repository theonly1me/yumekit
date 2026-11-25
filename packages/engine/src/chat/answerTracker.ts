import { randomUUID } from "node:crypto";
import type { BrainEvent } from "@yumekit/brain";
import type { ChatLog } from "./chatLog.js";
import type { AnswerEntry } from "./chatTypes.js";
import { capabilityOf, createCallNotes, type CallNote } from "./stepNotes.js";

export const textIntervalMilliseconds = 100;

const summaryLimit = 140;
export const aiChangedSummary = "The AI changed the project.";

export interface AnswerTracker {
  onEvent: (event: BrainEvent) => void;
  finish: (state: AnswerEntry["state"]) => void;
  changeSummary: () => string;
  noteCall: (tool: string) => CallNote;
  continueInNewAnswer: () => void;
}

const quoteMarks: Record<string, number> = {
  '"': 0,
  "\u201c": 1,
  "\u201d": -1,
};

function firstSentenceOf(text: string): string {
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index);
    const change = quoteMarks[character];
    if (change !== undefined) {
      depth = change === 0 ? (depth > 0 ? 0 : 1) : Math.max(0, depth + change);
    }
    const next = text.charAt(index + 1);
    if (depth === 0 && /[.!?]/.test(character) && /\s|^$/.test(next)) {
      return text.slice(0, index + 1);
    }
  }
  return text;
}

const fewestSummaryWords = 4;

function wordCountOf(text: string): number {
  return text.split(/\s+/).filter((word) => word !== "").length;
}

export function changeSummaryOf(text: string): string {
  let rest = text.trim();
  let summary = "";
  while (rest !== "" && wordCountOf(summary) < fewestSummaryWords) {
    const sentence = firstSentenceOf(rest);
    summary = `${summary} ${sentence.trim()}`.trim();
    rest = rest.slice(sentence.length).trim();
  }
  if (summary === "") return aiChangedSummary;
  return summary.slice(0, summaryLimit);
}

export function changeSummaryOfTexts(texts: string[]): string {
  const closingText = texts.findLast((text) => text.trim() !== "");
  return changeSummaryOf(closingText ?? "");
}

export function createAnswerTracker(options: {
  log: ChatLog;
  answer: AnswerEntry;
}): AnswerTracker {
  const { log } = options;
  let answer = options.answer;
  const wholeTexts: string[] = [];
  const closingTexts: string[] = [];
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
  const notes = createCallNotes({
    steps: () => answer.steps,
    putSteps: (steps) => {
      put({ ...answer, steps });
    },
  });
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
          closingTexts.push(event.text);
          put({ ...answer, text: fullText() });
          return;
        case "tool-started": {
          const capability = capabilityOf(event.input);
          put({
            ...answer,
            steps: [
              ...answer.steps,
              notes.withWaitingReason({
                callId: event.callId,
                tool: event.tool,
                state: "running",
                ...(capability === undefined ? {} : { capability }),
              }),
            ],
          });
          return;
        }
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
    changeSummary: () => changeSummaryOfTexts([...closingTexts, partText]),
    noteCall: notes.noteCall,
    continueInNewAnswer: () => {
      clearTimeout(trailingSend);
      trailingSend = undefined;
      const { steps } = answer;
      const isRunning = (step: AnswerEntry["steps"][number]) =>
        step.state === "running";
      put({
        ...answer,
        text: fullText(),
        state: "done",
        steps: steps.filter((step) => !isRunning(step)),
      });
      wholeTexts.length = 0;
      partText = "";
      put({
        kind: "answer",
        id: randomUUID(),
        text: "",
        state: "running",
        steps: steps.filter(isRunning),
      });
    },
  };
}
