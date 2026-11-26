import type { ReactNode } from "react";
import { AskForm, type SceneChip } from "./AskForm.js";
import { ChatHistory } from "./ChatHistory.js";
import type { AskInput } from "./chatRequests.js";
import { useDropZone, type PendingFiles } from "./files/index.js";
import { PermissionCard } from "./permissions/PermissionCard.js";
import { openPermissionsOf } from "./permissions/openPermissions.js";
import { QuestionCard } from "./questions/QuestionCard.js";
import { RunningWork } from "./running/RunningWork.js";
import type { WorkItem } from "./running/workSchema.js";
import { useAskSend } from "./useAskSend.js";
import type { Chat } from "./useChat.js";
import type { ChatBox } from "./useChatBox.js";
import "./chat.css";

export function ChatPanel(props: {
  chat: Chat;
  box: ChatBox;
  files: PendingFiles;
  chip: SceneChip | undefined;
  isHidden: boolean;
  sceneNumberOf: (clipId: string) => number | undefined;
  onOpenAiSettings: () => void;
  runningWork: WorkItem[];
  afterHistory?: ReactNode;
  isMoneyElsewhere?: boolean;
}) {
  const { chat, box, chip } = props;
  const ask = useAskSend({ chat, box, files: props.files, chip });
  const drop = useDropZone(props.files.add);
  const sendInput = (input: AskInput) => {
    chat.send(input).catch(() => undefined);
  };
  return (
    <div className="chat-pane" hidden={props.isHidden} {...drop.zoneProps}>
      <ChatHistory
        chat={chat}
        isHidden={props.isHidden}
        sceneNumberOf={props.sceneNumberOf}
        onSend={sendInput}
        onOpenAiSettings={props.onOpenAiSettings}
        after={props.afterHistory}
        isMoneyElsewhere={props.isMoneyElsewhere === true}
      />
      <div className="ask">
        <RunningWork items={props.runningWork} />
        {openPermissionsOf(chat.entries).map((entry) => (
          <PermissionCard
            key={entry.id}
            entry={entry}
            onAnswer={(answer) =>
              chat.answerPermission({ entryId: entry.id, answer })
            }
          />
        ))}
        {ask.round === undefined ? undefined : (
          <QuestionCard
            key={ask.round.id}
            card={ask.card}
            isSending={ask.isSending}
            onSend={ask.sendAnswers}
          />
        )}
        <AskForm
          box={box}
          files={props.files}
          isDragging={drop.isDragging}
          chip={chip}
          agent={chat.agent}
          isRunning={chat.isRunning}
          onSend={ask.sendFromBox}
          onStop={() => {
            chat.stop().catch(() => undefined);
          }}
          onOpenAiSettings={props.onOpenAiSettings}
        />
      </div>
      <p className="hidden-label" aria-live="polite">
        {chat.announcement}
      </p>
    </div>
  );
}
