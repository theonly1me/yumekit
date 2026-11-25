import { AskForm, type SceneChip } from "./AskForm.js";
import { ChatHistory } from "./ChatHistory.js";
import type { AskInput } from "./chatRequests.js";
import { RunningWork } from "./running/RunningWork.js";
import type { WorkItem } from "./running/workSchema.js";
import { Suggestions } from "./Suggestions.js";
import type { Chat } from "./useChat.js";
import type { ChatBox } from "./useChatBox.js";
import "./chat.css";

export function ChatPanel(props: {
  chat: Chat;
  box: ChatBox;
  chip: SceneChip | undefined;
  hasScenes: boolean;
  isHidden: boolean;
  sceneNumberOf: (clipId: string) => number | undefined;
  onOpenAiSettings: () => void;
  runningWork: WorkItem[];
}) {
  const { chat, box, chip } = props;
  const sendInput = (input: AskInput) => {
    chat.send(input).catch(() => undefined);
  };
  const sendForTheWholeVideo = (text: string) => {
    sendInput({ text, aboutClipId: undefined });
  };
  return (
    <div className="chat-pane" hidden={props.isHidden}>
      <ChatHistory
        chat={chat}
        isHidden={props.isHidden}
        sceneNumberOf={props.sceneNumberOf}
        onSend={sendInput}
        onOpenAiSettings={props.onOpenAiSettings}
      />
      <div className="ask">
        <RunningWork items={props.runningWork} />
        <Suggestions
          hasScenes={props.hasScenes}
          isRunning={chat.isRunning}
          onSend={sendForTheWholeVideo}
          onFill={box.fill}
        />
        <AskForm
          box={box}
          chip={chip}
          agent={chat.agent}
          isRunning={chat.isRunning}
          onSend={(text) => {
            chat.send({ text, aboutClipId: chip?.clipId }).then(
              (isSent) => {
                if (isSent) box.setDraft("");
              },
              () => undefined,
            );
          }}
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
