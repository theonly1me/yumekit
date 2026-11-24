import { z } from "zod";
import type { Exchange, Route } from "./exchange.js";
import { agentClient, clientHeader } from "./projectRoutes.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson } from "./responses.js";

export const longestVideoLimitSeconds = 3600;
export const largestSpendingLimitUsd = 10_000;

const limitBodySchema = z
  .strictObject({
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

async function putLimits(exchange: Exchange) {
  if (exchange.request.headers[clientHeader] === agentClient) {
    return {
      status: 403,
      kind: "limit-not-for-the-ai",
      message:
        "Only the person can change a limit, in Settings. The AI can read the limits with list_media_tools.",
    };
  }
  const body = await readJsonBody({
    request: exchange.request,
    schema: limitBodySchema,
  });
  if (!body.ok) return body.failure;
  const { generated_video_seconds: seconds, spending_usd: usd } = body.value;
  const changed = await exchange.context.mediaTools.setLimits({
    ...(seconds === undefined ? {} : { generatedVideoSeconds: seconds }),
    ...(usd === undefined ? {} : { spendingUsd: Math.round(usd * 100) / 100 }),
  });
  if (!changed.ok) {
    const { kind, message } = changed.failure;
    const status = kind === "invalid-configuration-file" ? 409 : 500;
    return { status, kind, message };
  }
  exchange.context.events.send({ type: "media-servers-changed" });
  sendJson({
    response: exchange.response,
    status: 200,
    body: {
      generated_video_seconds: changed.value.generatedVideoSeconds,
      spending_usd: changed.value.spendingUsd,
    },
  });
  return undefined;
}

export const mediaLimitRoutes: Route[] = [
  { method: "PUT", pattern: ["api", "media", "limits"], handle: putLimits },
];
