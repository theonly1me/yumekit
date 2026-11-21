import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";

const capabilitySchema = z.enum(["image", "speech", "align", "music", "video"]);

const settingSchema = z.discriminatedUnion("kind", [
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("choice"),
    choices: z.array(z.string()),
    default: z.string(),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("whole-number"),
    minimum: z.number(),
    maximum: z.number(),
    default: z.number(),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("switch"),
    default: z.boolean(),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("image-file"),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("image-files"),
    maximum: z.number(),
  }),
]);

const priceSchema = z.object({
  usd: z.number(),
  unit: z.enum(["second", "image", "minute", "thousand-characters"]),
  when: z.record(z.string(), z.string()),
});

const modelSchema = z.object({
  id: z.string(),
  label: z.string(),
  capability: capabilitySchema,
  is_default: z.boolean(),
  settings: z.array(settingSchema),
  prices: z.array(priceSchema),
  read_on: z.string(),
});

const keySchema = z.object({
  variable: z.string(),
  label: z.string(),
  get_key_url: z.string(),
  steps: z.array(z.string()),
  source: z.enum(["environment", "key-file", "missing"]),
});

const serverSchema = z.object({
  server: z.string(),
  capabilities: z.array(capabilitySchema),
  label: z.string().optional(),
  runs: z.enum(["hosted", "on-this-computer"]).optional(),
  models: z.array(modelSchema).default([]),
  keys: z.array(keySchema),
});

export const mediaServersSchema = z.object({
  servers: z.array(serverSchema),
  failed_servers: z.array(
    z.object({ server: z.string(), message: z.string() }),
  ),
  generated_video: z.object({
    limit_seconds: z.number(),
    used_seconds: z.number(),
  }),
});

export type Capability = z.infer<typeof capabilitySchema>;
export type MediaServers = z.infer<typeof mediaServersSchema>;
export type MediaServer = z.infer<typeof serverSchema>;
export type MediaKey = z.infer<typeof keySchema>;
export type MediaModel = z.infer<typeof modelSchema>;
export type ModelSetting = z.infer<typeof settingSchema>;
export type ModelPrice = z.infer<typeof priceSchema>;

const keyStateSchema = z.object({
  variable: z.string(),
  source: z.enum(["environment", "key-file", "missing"]),
});

const keyCheckSchema = z.object({ valid: z.boolean(), message: z.string() });

const keyPath = (variable: string) =>
  `/api/keys/${encodeURIComponent(variable)}`;

export function mediaServerRequests(client: EngineClient) {
  return {
    list: () =>
      client.readJson({
        path: "/api/media-servers",
        schema: mediaServersSchema,
      }),
    saveKey: (key: { variable: string; value: string }) =>
      client.readJson({
        path: keyPath(key.variable),
        method: "PUT",
        schema: keyStateSchema,
        body: { value: key.value },
      }),
    removeKey: (variable: string) =>
      client.readJson({
        path: keyPath(variable),
        method: "DELETE",
        schema: keyStateSchema,
      }),
    checkKey: (server: string) =>
      client.readJson({
        path: `/api/keys/${encodeURIComponent(server)}/check`,
        method: "POST",
        schema: keyCheckSchema,
      }),
  };
}
