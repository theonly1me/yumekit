import type { AskInput } from "../../chat/chatRequests.js";
import type { SentNote } from "../takes/review/sentNotes.js";

export const storyYesText =
  "I approve the story. Save my yes to it, then go on to the next step.";

function noteLineOf(note: SentNote): string {
  return note.quote === undefined
    ? note.text
    : `On "${note.quote}": ${note.text}`;
}

export function storyRequestOf(notes: SentNote[]): AskInput {
  if (notes.length === 0) {
    return { text: storyYesText, aboutClipId: undefined };
  }
  const count = `${String(notes.length)} ${notes.length === 1 ? "note" : "notes"}`;
  return {
    text: `Change the story with my ${count}.`,
    details: [
      `The person left ${count} on the story:`,
      ...notes.map(
        (...[note, index]) => `${String(index + 1)}. ${noteLineOf(note)}`,
      ),
      "Write the story again with these changes, then show it to the person again.",
    ].join("\n"),
    aboutClipId: undefined,
  };
}
