import { z } from "zod";
import type { EngineClient, Reply } from "../../engine/engineClient.js";

const wireLimitsSchema = z.object({
  generated_video_seconds: z.number(),
  spending_usd: z.number(),
});

export const limitsSchema = wireLimitsSchema.extend({
  every_project: wireLimitsSchema,
  this_project: wireLimitsSchema.nullable(),
});

export type Limits = z.infer<typeof limitsSchema>;
export type WireLimits = z.infer<typeof wireLimitsSchema>;
export type LimitScope = "every-project" | "this-project";
export type LimitName = keyof WireLimits;

const limitsPath = "/api/media/limits";

export function readLimits(client: EngineClient): Promise<Reply<Limits>> {
  return client.readJson({ path: limitsPath, schema: limitsSchema });
}

export function saveLimit(options: {
  client: EngineClient;
  appliesTo: LimitScope;
  name: LimitName;
  value: number;
}): Promise<Reply<Limits>> {
  return options.client.readJson({
    path: limitsPath,
    method: "PUT",
    schema: limitsSchema,
    body: { applies_to: options.appliesTo, [options.name]: options.value },
  });
}

export function removeOwnLimits(client: EngineClient): Promise<Reply<Limits>> {
  return client.readJson({
    path: `${limitsPath}/this-project`,
    method: "DELETE",
    schema: limitsSchema,
  });
}
