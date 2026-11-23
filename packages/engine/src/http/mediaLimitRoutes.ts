import { z } from "zod";
import type { Exchange, Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson } from "./responses.js";

export const longestVideoLimitSeconds = 3600;

const limitBodySchema = z.strictObject({
  generated_video_seconds: z
    .number()
    .int()
    .min(0)
    .max(longestVideoLimitSeconds),
});

async function putLimits(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: limitBodySchema,
  });
  if (!body.ok) return body.failure;
  const changed = await exchange.context.mediaTools.setVideoLimit(
    body.value.generated_video_seconds,
  );
  if (!changed.ok) {
    const { kind, message } = changed.failure;
    const status = kind === "invalid-configuration-file" ? 409 : 500;
    return { status, kind, message };
  }
  exchange.context.events.send({ type: "media-servers-changed" });
  sendJson({
    response: exchange.response,
    status: 200,
    body: { generated_video_seconds: changed.value.generatedVideoSeconds },
  });
  return undefined;
}

export const mediaLimitRoutes: Route[] = [
  { method: "PUT", pattern: ["api", "media", "limits"], handle: putLimits },
];
