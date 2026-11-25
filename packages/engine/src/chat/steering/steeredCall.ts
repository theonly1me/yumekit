import { harnessFailureResult, type HarnessResult } from "@yumekit/harness-mcp";
import type { SteeringEntry } from "../chatTypes.js";
import type { SteeringDesk } from "./steeringDesk.js";
import { steeringBlockOf, steeringDataOf } from "./steeringText.js";

export const toolsThatCanSpend = new Set([
  "generate_asset",
  "generate_assets",
  "replace_narration",
  "replace_music",
  "make_sharper_copy",
]);

export function withSteering(options: {
  result: HarnessResult;
  messages: SteeringEntry[];
}): HarnessResult {
  const { result, messages } = options;
  const block = steeringBlockOf(messages);
  const personMessages = steeringDataOf(messages);
  const { mcpResult } = result;
  return {
    ...result,
    text: `${block}\n${result.text}`,
    data: { person_messages: personMessages, ...result.data },
    mcpResult: {
      ...mcpResult,
      content: [{ type: "text", text: block }, ...mcpResult.content],
      structuredContent: {
        person_messages: personMessages,
        ...mcpResult.structuredContent,
      },
    },
  };
}

function messageWaitingResult(messages: SteeringEntry[]): HarnessResult {
  return withSteering({
    result: harnessFailureResult({
      kind: "person-message-waiting",
      message:
        "The person sent a message while you worked, so this call did not run and spent nothing.",
      hint: "Read the message of the person first and act on it. Make this call again only if it still fits what the person wants.",
    }),
    messages,
  });
}

export async function steeredLeadCall(options: {
  desk: SteeringDesk;
  tool: string;
  call: () => Promise<HarnessResult>;
  onDelivered: () => void;
}): Promise<HarnessResult> {
  const { desk } = options;
  const delivered = () => {
    const messages = desk.take();
    if (messages.length > 0) options.onDelivered();
    return messages;
  };
  if (toolsThatCanSpend.has(options.tool) && desk.waiting().length > 0) {
    return messageWaitingResult(delivered());
  }
  const result = await options.call();
  const messages = delivered();
  return messages.length === 0 ? result : withSteering({ result, messages });
}
