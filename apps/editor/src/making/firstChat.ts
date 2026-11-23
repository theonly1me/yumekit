import { useEffect, useState } from "react";
import { z } from "zod";
import { planFirstSentence } from "@yumekit/project/start-formats";
import {
  fullRequestTextOf,
  shownRequestTextOf,
} from "../chat/requestEntryText.js";
import type { EngineClient } from "../engine/engineClient.js";
import { fixedRequestTextOf } from "../parts/fixedRequests.js";

const stepSchema = z.object({
  tool: z.string(),
  state: z.enum(["running", "done", "failed"]),
});

const entrySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("request"),
    id: z.string(),
    text: z.string(),
    details: z.string().optional(),
  }),
  z.object({
    kind: z.literal("answer"),
    id: z.string(),
    state: z.enum(["running", "done", "stopped", "failed"]),
    steps: z.array(stepSchema),
  }),
  z.object({ kind: z.literal("change"), id: z.string() }),
  z.object({ kind: z.literal("notice"), id: z.string(), text: z.string() }),
]);

const chatSchema = z.object({ entries: z.array(entrySchema) });

export type ChatEntry = z.infer<typeof entrySchema>;
export type AnswerEntry = Extract<ChatEntry, { kind: "answer" }>;
export type AnswerStep = z.infer<typeof stepSchema>;

export type MakingPhase = "whole" | "plan" | "rest";

export interface FirstChat {
  requestCount: number;
  requestText: string;
  phase: MakingPhase;
  answer: AnswerEntry | undefined;
  lastNotice: string | undefined;
}

const continueText = fixedRequestTextOf({ kind: "continue-after-the-plan" });

function planAndRestOf(options: {
  requests: Extract<ChatEntry, { kind: "request" }>[];
  answers: AnswerEntry[];
}): Pick<FirstChat, "phase" | "answer"> {
  const [request, continueRequest] = options.requests;
  const [planAnswer, restAnswer] = options.answers;
  if (
    request === undefined ||
    !fullRequestTextOf(request).endsWith(planFirstSentence)
  ) {
    return { phase: "whole", answer: planAnswer };
  }
  if (
    continueRequest?.text !== continueText ||
    planAnswer === undefined ||
    restAnswer === undefined
  ) {
    return { phase: "plan", answer: planAnswer };
  }
  return {
    phase: "rest",
    answer: {
      ...restAnswer,
      steps: [...planAnswer.steps, ...restAnswer.steps],
    },
  };
}

export type FirstChatState =
  { kind: "loading" } | { kind: "ready"; chat: FirstChat };

export function firstChatOf(entries: ChatEntry[]): FirstChat {
  const requests = entries.filter((entry) => entry.kind === "request");
  const answers = entries.filter((entry) => entry.kind === "answer");
  const notices = entries.filter((entry) => entry.kind === "notice");
  const [request] = requests;
  return {
    requestCount: requests.length,
    requestText: request === undefined ? "" : shownRequestTextOf(request),
    ...planAndRestOf({ requests, answers }),
    lastNotice: notices.at(-1)?.text,
  };
}

export function useFirstChat(client: EngineClient): FirstChatState {
  const [state, setState] = useState<FirstChatState>({ kind: "loading" });

  useEffect(() => {
    let isCurrent = true;
    let loadNumber = 0;
    const load = () => {
      loadNumber += 1;
      const thisLoad = loadNumber;
      client
        .readJson({ path: "/api/chat", schema: chatSchema })
        .then((reply) => {
          if (!isCurrent || thisLoad !== loadNumber) return;
          setState({
            kind: "ready",
            chat: firstChatOf(reply.ok ? reply.value.entries : []),
          });
        })
        .catch(() => undefined);
    };
    load();
    const stopListening = client.events.listen((event) => {
      if (event.type === "chat-changed" || event.type === "connection-opened")
        load();
    });
    return () => {
      isCurrent = false;
      stopListening();
    };
  }, [client]);

  return state;
}
