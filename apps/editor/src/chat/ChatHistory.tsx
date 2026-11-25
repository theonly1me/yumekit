import { useLayoutEffect, useRef } from "react";
import { AnswerView } from "./AnswerView.js";
import { ChangeLine } from "./ChangeLine.js";
import { laterChangeCount, retryOf, roundOf } from "./chatEntries.js";
import type { AskInput } from "./chatRequests.js";
import type { ChatEntry } from "./chatSchemas.js";
import { NoticeView, type NoticeAction } from "./NoticeView.js";
import { PersonMessage } from "./PersonMessage.js";
import { StartFailureView } from "./StartFailureView.js";
import type { Chat } from "./useChat.js";

const stuckDistancePixels = 48;

export function ChatHistory(props: {
  chat: Chat;
  isHidden: boolean;
  sceneNumberOf: (clipId: string) => number | undefined;
  onSend: (input: AskInput) => void;
  onOpenAiSettings: () => void;
}) {
  const { chat } = props;
  const list = useRef<HTMLOListElement>(null);
  const isStuck = useRef(true);
  const savedScrollTop = useRef(0);
  const lastAnswer = chat.entries.findLast((entry) => entry.kind === "answer");
  const liveText = lastAnswer?.kind === "answer" ? chat.textOf(lastAnswer) : "";

  useLayoutEffect(() => {
    const element = list.current;
    if (element === null || props.isHidden) return;
    element.scrollTop = isStuck.current
      ? element.scrollHeight
      : savedScrollTop.current;
  }, [chat.entries, liveText, chat.startFailure, props.isHidden]);

  const retryActions = (entryId: string): NoticeAction[] => {
    const retry = retryOf({ entries: chat.entries, noticeId: entryId });
    return retry === undefined || chat.isRunning
      ? []
      : [
          {
            label: "Try again",
            onAction: () => {
              props.onSend(retry);
            },
          },
        ];
  };

  const viewOf = (entry: ChatEntry) => {
    switch (entry.kind) {
      case "request":
      case "steering":
        return (
          <PersonMessage
            key={entry.id}
            entry={entry}
            round={roundOf({ entries: chat.entries, roundId: entry.roundId })}
            sceneNumberOf={props.sceneNumberOf}
          />
        );
      case "questions":
        return undefined;
      case "answer":
        return (
          <AnswerView key={entry.id} answer={entry} text={chat.textOf(entry)} />
        );
      case "change":
        return (
          <ChangeLine
            key={entry.id}
            change={entry}
            laterCount={laterChangeCount({
              entries: chat.entries,
              changeId: entry.id,
            })}
            isBusy={chat.isRunning}
            onUndo={() => chat.undo(entry.id)}
          />
        );
      case "notice":
        return (
          <NoticeView
            key={entry.id}
            text={entry.text}
            actions={retryActions(entry.id)}
            isAlert={false}
          />
        );
    }
  };

  return (
    <ol
      className="chat"
      ref={list}
      aria-label="Chat with the AI"
      onScroll={(event) => {
        const element = event.currentTarget;
        if (element.clientHeight === 0) return;
        savedScrollTop.current = element.scrollTop;
        isStuck.current =
          element.scrollHeight - element.scrollTop - element.clientHeight <
          stuckDistancePixels;
      }}
    >
      {chat.entries.length === 0 && chat.startFailure === undefined ? (
        <li className="chat-empty">
          Tell the AI what to make or change. Each change shows here, with Undo.
        </li>
      ) : undefined}
      {chat.entries.map(viewOf)}
      {chat.startFailure === undefined ? undefined : (
        <StartFailureView
          failure={chat.startFailure}
          isRunning={chat.isRunning}
          onSend={props.onSend}
          onOpenAiSettings={props.onOpenAiSettings}
        />
      )}
    </ol>
  );
}
