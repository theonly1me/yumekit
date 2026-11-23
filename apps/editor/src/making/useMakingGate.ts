import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { useFirstChat, type AnswerEntry, type FirstChat } from "./firstChat.js";
import { startFailureOf, type StartFailure } from "./firstRequestFailure.js";

export type MakingGate =
  | { kind: "loading" }
  | { kind: "editor" }
  | { kind: "failure"; failure: StartFailure; onOpenEditor: () => void }
  | {
      kind: "making";
      chat: FirstChat & { answer: AnswerEntry };
      onOpenEditor: () => void;
    };

type Decision = "undecided" | "making" | "failure" | "editor";

function firstDecisionOf(options: {
  chat: FirstChat;
  firstRequestFailure: string | undefined;
}): Decision {
  const { chat } = options;
  if (options.firstRequestFailure !== undefined && chat.requestCount === 0) {
    return "failure";
  }
  const state = chat.answer?.state;
  const isFirstRunning = chat.requestCount === 1 && state === "running";
  const isPlanWaiting =
    chat.phase === "plan" && chat.requestCount === 1 && state === "done";
  const isRestRunning =
    chat.phase === "rest" && chat.requestCount === 2 && state === "running";
  return isFirstRunning || isPlanWaiting || isRestRunning ? "making" : "editor";
}

export function useMakingGate(options: {
  client: EngineClient;
  firstRequestFailure: string | undefined;
}): MakingGate {
  const chatState = useFirstChat(options.client);
  const [decision, setDecision] = useState<Decision>("undecided");
  if (decision === "undecided" && chatState.kind === "ready") {
    setDecision(
      firstDecisionOf({
        chat: chatState.chat,
        firstRequestFailure: options.firstRequestFailure,
      }),
    );
  }
  const answerState =
    chatState.kind === "ready" ? chatState.chat.answer?.state : undefined;

  if (decision === "making" && answerState === "stopped") {
    setDecision("editor");
  }

  const onOpenEditor = () => {
    setDecision("editor");
  };
  if (decision === "editor") return { kind: "editor" };
  if (decision === "failure") {
    return {
      kind: "failure",
      failure: startFailureOf(options.firstRequestFailure ?? ""),
      onOpenEditor,
    };
  }
  if (decision === "making" && chatState.kind === "ready") {
    const { answer } = chatState.chat;
    if (answer !== undefined) {
      return {
        kind: "making",
        chat: { ...chatState.chat, answer },
        onOpenEditor,
      };
    }
  }
  return decision === "making" ? { kind: "editor" } : { kind: "loading" };
}
