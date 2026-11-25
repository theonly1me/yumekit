import { requestTextOf } from "../aboutClip.js";
import type { SteeringEntry } from "../chatTypes.js";

export const steeringRule = [
  "The person sent this while you worked. Read it now, before your next step.",
  "It has priority over your present plan. If it conflicts with the plan, the message of the person wins: change the plan.",
  "A choice of the person of a clip, a picture, or music overrides a verdict of the critic.",
  "Tell the person in one sentence what you do about it, then do it.",
].join("\n");

function sentTimeOf(sentAt: string): string {
  const [day = "", time = ""] = sentAt.split("T");
  return `${time.slice(0, 8)} UTC on ${day}`;
}

function messageTextOf(message: SteeringEntry): string {
  return requestTextOf({
    text: [message.text, message.details ?? ""].join("\n").trim(),
    about: message.about,
  });
}

function numberedMessagesOf(messages: SteeringEntry[]): string[] {
  return messages.map(
    (...[message, index]) =>
      `Message ${String(index + 1)}, sent at ${sentTimeOf(message.sentAt)}:\n${messageTextOf(message)}`,
  );
}

export function steeringBlockOf(messages: SteeringEntry[]): string {
  const title =
    messages.length === 1
      ? "A MESSAGE FROM THE PERSON"
      : `${String(messages.length)} MESSAGES FROM THE PERSON, IN ORDER`;
  return [
    `=== ${title} ===`,
    steeringRule,
    "",
    ...numberedMessagesOf(messages),
    `=== END OF ${title} ===`,
  ].join("\n");
}

export function steeringRequestTextOf(messages: SteeringEntry[]): string {
  const [only] = messages;
  if (messages.length === 1 && only !== undefined) return messageTextOf(only);
  return [
    "The person sent these messages while you worked on the last request. Act on each, in order:",
    ...numberedMessagesOf(messages),
  ].join("\n\n");
}

export function steeringDataOf(messages: SteeringEntry[]) {
  return {
    rule: steeringRule,
    messages: messages.map((message) => ({
      text: messageTextOf(message),
      sent_at: message.sentAt,
    })),
  };
}
