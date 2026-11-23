import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { fixedRequestTextOf } from "../parts/fixedRequests.js";
import {
  hasReadyService,
  useMediaChoices,
} from "../settings/services/index.js";
import type { EditorChat } from "../shell/useEditorChat.js";
import {
  soundNotesOf,
  type SoundAction,
  type SoundNote,
} from "./soundNotes.js";
import type { SoundPartName, SoundRow } from "./soundRowFacts.js";

function requestTextOf(options: {
  note: SoundNote;
  action: SoundAction;
}): string | undefined {
  switch (options.action) {
    case "record-the-voice-again":
      return fixedRequestTextOf({ kind: "record-the-changed-lines" });
    case "try-again":
      return fixedRequestTextOf({
        kind: "try-the-step-again",
        part: options.note.part,
      });
    case "make-the-rest":
      return fixedRequestTextOf({ kind: "make-the-rest" });
    case "add-a-key":
    case "use-my-own-music":
      return undefined;
  }
}

export function useSoundNotes(options: {
  client: EngineClient;
  snapshot: Snapshot;
  rows: SoundRow[];
  editorChat: EditorChat;
  onOpenSound: (part: SoundPartName) => void;
}) {
  const { editorChat } = options;
  const choices = useMediaChoices(options.client);
  const answer = editorChat.chat.entries
    .filter((entry) => entry.kind === "answer")
    .at(-1);
  const notes = soundNotesOf({
    rows: options.rows,
    snapshot: options.snapshot,
    answer,
    musicIsReady:
      choices.state.kind !== "ready" ||
      hasReadyService({ choices: choices.state.choices, kind: "music" }),
  });
  return {
    notes,
    onNoteAction: (choice: { note: SoundNote; action: SoundAction }) => {
      const text = requestTextOf(choice);
      if (text === undefined) {
        options.onOpenSound("music");
        return;
      }
      editorChat.sendText(text);
    },
  };
}
