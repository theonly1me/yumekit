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
}

export function changeSummaryOf(text: string): string {
  const [firstSentence] = text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
  if (firstSentence === undefined) return aiChangedSummary;
  return firstSentence.slice(0, summaryLimit);
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
    changeSummary: () => changeSummaryOf(fullText()),
    noteCall: notes.noteCall,
  };
}
