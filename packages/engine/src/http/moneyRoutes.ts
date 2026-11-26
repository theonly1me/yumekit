import { z } from "zod";
import type { MoneyEntry } from "../chat/chatTypes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { helperTokenOf } from "./helperCalls.js";
import { agentClient, clientHeader } from "./projectRoutes.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const choiceBodySchema = z.strictObject({
  choice: z.enum(["raise", "fewer", "stop"]),
});

const notForTheAi: Failure = {
  status: 403,
  kind: "limit-not-for-the-ai",
  message: "Only the person picks what happens when the money runs out.",
};

async function raiseProjectLimit(options: {
  exchange: Exchange;
  entry: MoneyEntry;
}): Promise<Failure | undefined> {
  const { mediaTools, events } = options.exchange.context;
  const inUse = await mediaTools.limits();
  if (inUse.spendingUsd >= options.entry.raiseToUsd) return undefined;
  const raised = await mediaTools.setLimits({
    appliesTo: "this-project",
    limits: { spendingUsd: options.entry.raiseToUsd },
  });
  if (!raised.ok) {
    return { status: 409, ...raised.failure };
  }
  events.send({ type: "media-servers-changed" });
  return undefined;
}

async function answerMoney(exchange: Exchange) {
  if (
    exchange.request.headers[clientHeader] === agentClient ||
    helperTokenOf(exchange) !== undefined
  ) {
    return notForTheAi;
  }
  const body = await readJsonBody({
    request: exchange.request,
    schema: choiceBodySchema,
  });
  if (!body.ok) return body.failure;
  const [entryId = ""] = exchange.parameters;
  const { money } = exchange.context.chat;
  const entry = money.openEntry(entryId);
  if (entry === undefined) {
    return {
      status: 409,
      kind: "money-warning-not-open",
      message: "This choice about money is already made.",
    };
  }
  const { choice } = body.value;
  if (choice === "raise") {
    const failure = await raiseProjectLimit({ exchange, entry });
    if (failure !== undefined) return failure;
  }
  const answered = await money.answer({ entry, choice });
  if (!answered.ok) return { status: 409, ...answered.failure };
  sendJson({ response: exchange.response, status: 200, body: answered.value });
  return undefined;
}

export const moneyRoutes: Route[] = [
  {
    method: "POST",
    pattern: ["api", "chat", "money", anySegment],
    handle: answerMoney,
  },
];
