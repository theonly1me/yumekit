import { z } from "zod";
import type { EngineClient } from "../../../engine/engineClient.js";

const mediaRequestSchema = z.object({
  asset_id: z.string(),
  at: z.string(),
  basis: z.enum(["reported", "catalog", "cautious"]).optional(),
  capability: z.string(),
  failure: z.object({ kind: z.string(), message: z.string() }).optional(),
  files: z.array(z.string()).optional(),
  model: z.string().optional(),
  pictures: z.array(z.object({ file: z.string(), role: z.string() })),
  prompt_from_you: z.string().optional(),
  seconds: z.number(),
  server: z.string().optional(),
  settings: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
  shot_id: z.string().optional(),
  usd: z.number().optional(),
});

const mediaRequestsSchema = z.object({
  requests: z.array(mediaRequestSchema),
});

export type MediaRequest = z.infer<typeof mediaRequestSchema>;

export function readMediaRequests(client: EngineClient) {
  return client.readJson({
    path: "/api/media/requests",
    schema: mediaRequestsSchema,
  });
}
