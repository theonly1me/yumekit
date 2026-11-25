export interface PersonQuestion {
  id: string;
  text: string;
  options: string[];
  multiple: boolean;
}

export type AskPersonOutcome =
  | { ok: true; roundId: string }
  | { ok: false; failure: { kind: string; message: string; hint: string } };

export type AskPerson = (
  questions: PersonQuestion[],
) => Promise<AskPersonOutcome>;

export const noPersonFailure = {
  kind: "no-chat-request",
  message:
    "This session cannot ask the person. ask_person works only inside a request of the chat of the editor.",
  hint: "Ask the person in your answer text.",
};
