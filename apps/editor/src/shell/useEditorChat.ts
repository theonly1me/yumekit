import type { SceneChip } from "../chat/AskForm.js";
import { useChat } from "../chat/useChat.js";
import { useChatBox } from "../chat/useChatBox.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { EditorView } from "./useEditorView.js";

export type EditorChat = ReturnType<typeof useEditorChat>;

export function useEditorChat(options: {
  client: EngineClient;
  view: EditorView;
}) {
  const { view } = options;
  const chat = useChat(options.client);
  const box = useChatBox();
  const { pickedCard } = view;
  const chip: SceneChip | undefined =
    pickedCard === undefined || box.chipRemovedClipId === pickedCard.clip.id
      ? undefined
      : {
          clipId: pickedCard.clip.id,
          label: `About scene ${String(pickedCard.number)}: ${pickedCard.title}`,
        };
  const mainClipIds = view.facts.mainClips.map((clip) => clip.id);
  return {
    chat,
    box,
    chip,
    sceneNumberOf: (clipId: string) => {
      const index = mainClipIds.indexOf(clipId);
      return index === -1 ? undefined : index + 1;
    },
    focusBox: () => {
      view.setSideTab("chat");
      box.focus();
    },
    fillBox: (text: string) => {
      view.setSideTab("chat");
      box.fill(text);
    },
    sendText: (text: string) => {
      view.setSideTab("chat");
      chat.send({ text, aboutClipId: undefined }).catch(() => undefined);
    },
  };
}
