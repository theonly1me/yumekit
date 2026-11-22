import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { sendFixedRequest } from "../parts/fixedRequests.js";
import type { EditorChat } from "../shell/useEditorChat.js";
import { CastSheet } from "./CastSheet.js";

export function useCastSheet(options: {
  client: EngineClient;
  snapshot: Snapshot;
  editorChat: EditorChat;
  playback: { pause: () => void };
}) {
  const { editorChat } = options;
  const [isOpen, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  const sheet = isOpen ? (
    <CastSheet
      client={options.client}
      entries={options.snapshot.bible.cast}
      onMakePicture={(entry) => {
        close();
        sendFixedRequest({
          ask: (input) => {
            editorChat.focusBox();
            return editorChat.chat.send(input);
          },
          request: {
            kind: "make-a-cast-picture",
            name: entry.name,
            description: entry.description,
          },
        }).catch(() => undefined);
      }}
      onClose={close}
    />
  ) : undefined;
  return {
    isOpen,
    sheet,
    open: () => {
      options.playback.pause();
      setOpen(true);
    },
  };
}
