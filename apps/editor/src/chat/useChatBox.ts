import { useState } from "react";

export type ChatBox = ReturnType<typeof useChatBox>;

export function useChatBox() {
  const [draft, setDraft] = useState("");
  const [focusRequest, setFocusRequest] = useState(0);
  const [chipRemovedClipId, setChipRemovedClipId] = useState<string>();
  return {
    draft,
    setDraft,
    focusRequest,
    chipRemovedClipId,
    removeChip: setChipRemovedClipId,
    focus: () => {
      setFocusRequest((current) => current + 1);
    },
    fill: (text: string) => {
      setDraft(text);
      setFocusRequest((current) => current + 1);
    },
  };
}
