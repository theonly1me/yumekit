import { useState } from "react";
import type { SceneChip } from "./AskForm.js";
import type { PendingFiles } from "./files/index.js";
import type { QuestionsEntry } from "./questions/questionSchemas.js";
import { openRoundOf, useQuestionCard } from "./questions/useQuestionCard.js";
import type { Chat } from "./useChat.js";
import type { ChatBox } from "./useChatBox.js";

export function useAskSend(options: {
  chat: Chat;
  box: ChatBox;
  files: PendingFiles;
  chip: SceneChip | undefined;
}) {
  const { chat, box, files } = options;
  const round = openRoundOf(chat.entries);
  const card = useQuestionCard(round);
  const [isSending, setSending] = useState(false);
  const answersOf = (open: QuestionsEntry) => ({
    roundId: open.id,
    answers: card.answersOf(open),
  });
  const whileSending = (send: () => Promise<boolean>) => {
    setSending(true);
    send()
      .finally(() => {
        setSending(false);
      })
      .catch(() => undefined);
  };
  return {
    round,
    card,
    isSending,
    sendFromBox: (text: string) => {
      whileSending(async () => {
        const uploaded = await files.upload();
        if (!uploaded.ok) return false;
        const isSent = await chat.send({
          text,
          aboutClipId: options.chip?.clipId,
          files: uploaded.files,
          answers: round === undefined ? undefined : answersOf(round),
        });
        if (isSent) {
          box.setDraft("");
          files.clear();
        }
        return isSent;
      });
    },
    sendAnswers: () => {
      if (round === undefined) return;
      whileSending(() =>
        chat.send({
          text: "",
          aboutClipId: undefined,
          answers: answersOf(round),
        }),
      );
    },
  };
}
