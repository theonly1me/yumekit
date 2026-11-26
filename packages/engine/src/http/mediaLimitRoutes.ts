import {
  hasOwnLimits,
  limitsInUseOf,
  type LimitSources,
  type MediaLimits,
  type Outcome,
  type UserFileFailure,
} from "@yumekit/tools";
import { z } from "zod";
import type { Exchange, Route } from "./exchange.js";
import { agentClient, clientHeader } from "./projectRoutes.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

export const longestVideoLimitSeconds = 3600;
export const largestSpendingLimitUsd = 10_000;

const limitBodySchema = z
  .strictObject({
    applies_to: z.enum(["every-project", "this-project"]),
    generated_video_seconds: z
      .number()
      .int()
      .min(0)
      .max(longestVideoLimitSeconds)
      .optional(),
    spending_usd: z.number().min(0).max(largestSpendingLimitUsd).optional(),
  })
  .refine(
    (body) =>
      body.generated_video_seconds !== undefined ||
      body.spending_usd !== undefined,
    "Give generated_video_seconds, spending_usd, or both.",
  );

const notForTheAi: Failure = {
  status: 403,
  kind: "limit-not-for-the-ai",
  message:
    "Only the person can change a limit, in Settings. The AI can read the limits with list_media_tools.",
};

function wireLimitsOf(limits: MediaLimits) {
  return {
    generated_video_seconds: limits.generatedVideoSeconds,
    spending_usd: limits.spendingUsd,
  };
}

export function limitsBodyOf(sources: LimitSources) {
  return {
    ...wireLimitsOf(limitsInUseOf(sources)),
    every_project: wireLimitsOf(sources.everyProject),
    this_project: hasOwnLimits(sources)
      ? wireLimitsOf(limitsInUseOf(sources))
      : null,
  };
}

function isByAgent(exchange: Exchange): boolean {
  return exchange.request.headers[clientHeader] === agentClient;
}

function sendLimits(options: {
  exchange: Exchange;
  read: Outcome<LimitSources, UserFileFailure>;
}): Failure | undefined {
  const { exchange, read } = options;
  if (!read.ok) {
    const { kind, message } = read.failure;
    const status = kind === "invalid-configuration-file" ? 409 : 500;
    return { status, kind, message };
  }
  sendJson({
    response: exchange.response,
    status: 200,
    body: limitsBodyOf(read.value),
  });
  return undefined;
}

async function readLimits(exchange: Exchange) {
  const read = await exchange.context.mediaTools.limitSources();
  return sendLimits({ exchange, read });
}

async function putLimits(exchange: Exchange) {
  if (isByAgent(exchange)) return notForTheAi;
  const body = await readJsonBody({
    request: exchange.request,
    schema: limitBodySchema,
  });
  if (!body.ok) return body.failure;
  const { generated_video_seconds: seconds, spending_usd: usd } = body.value;
  const changed = await exchange.context.mediaTools.setLimits({
    appliesTo: body.value.applies_to,
    limits: {
      ...(seconds === undefined ? {} : { generatedVideoSeconds: seconds }),
      ...(usd === undefined
        ? {}
        : { spendingUsd: Math.round(usd * 100) / 100 }),
    },
  });
  if (changed.ok) {
    exchange.context.events.send({ type: "media-servers-changed" });
  }
  return sendLimits({ exchange, read: changed });
}

async function removeOwnLimits(exchange: Exchange) {
  if (isByAgent(exchange)) return notForTheAi;
  const removed = await exchange.context.mediaTools.removeOwnLimits();
  if (removed.ok) {
    exchange.context.events.send({ type: "media-servers-changed" });
  }
  return sendLimits({ exchange, read: removed });
}

export const mediaLimitRoutes: Route[] = [
  { method: "GET", pattern: ["api", "media", "limits"], handle: readLimits },
  { method: "PUT", pattern: ["api", "media", "limits"], handle: putLimits },
  {
    method: "DELETE",
    pattern: ["api", "media", "limits", "this-project"],
    handle: removeOwnLimits,
  },
];
