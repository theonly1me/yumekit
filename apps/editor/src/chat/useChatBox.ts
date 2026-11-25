import { useState } from "react";

export type ChatBox = ReturnType<typeof useChatBox>;

export const messageLimitCharacters = 20_000;

export const textTooLong =
  "This text is too long for one message. Paste the part that the AI needs into the box.";

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
    appendFileText: (file: { name: string; text: string }) => {
      const added = `From the file ${file.name}:\n${file.text.trim()}`;
      const next = draft.trim() === "" ? added : `${draft}\n\n${added}`;
      if (next.length > messageLimitCharacters) return textTooLong;
      setDraft(next);
      return undefined;
    },
  };
}
