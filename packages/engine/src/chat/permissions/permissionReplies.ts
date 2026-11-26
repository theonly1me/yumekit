export const permissionWaitMilliseconds = 10 * 60 * 1000;

export const allowReply = JSON.stringify({ behavior: "allow" });

export function denyReplyOf(message: string): string {
  return JSON.stringify({ behavior: "deny", message });
}

export const denyMessages = {
  person:
    "The person did not allow this. Do not try it again. Say in one sentence what you could not do.",
  earlier:
    "The person did not allow this earlier in this request. Do not try it again. Say in one sentence what you could not do.",
  noAnswer:
    "The person did not answer in 10 minutes, so this is not allowed. Do not try it again. Say in one sentence what you wanted to do.",
  ended: "The request ended before the person answered.",
  nobody:
    "Nobody can answer a permission question now: only the lead of a chat request in the editor can ask. Do the work with the yumekit tools.",
  keys: "The folder of the yumekit keys is closed to the AI. Never read or change a key.",
};

export const noDecisionReply = "{}";

export function hookReplyOf(options: {
  decision: "ask" | "deny";
  reason: string;
}): string {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: options.decision,
      permissionDecisionReason: options.reason,
    },
  });
}
