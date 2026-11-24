import type { Outcome } from "../engineTypes.js";
import type { ChatFailure } from "./chatTypes.js";

export const chatBusy: ChatFailure = {
  kind: "chat-busy",
  message: "The AI is still working on the last request. Wait or stop it.",
};

export const noServerCommand: ChatFailure = {
  kind: "no-server-command",
  message:
    "This engine cannot start the AI. Start the editor with yumekit open.",
};

export function failed<Value>(
  failure: ChatFailure,
): Outcome<Value, ChatFailure> {
  return { ok: false, failure };
}
