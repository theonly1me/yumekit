import { z } from "zod";
import type { EngineClient, Reply } from "../../engine/engineClient.js";

export const leadAccessChoices = ["ask-me", "yumekit-only"] as const;

export type LeadAccessChoice = (typeof leadAccessChoices)[number];

const leadAccessSchema = z.object({
  access: z.enum(leadAccessChoices),
  askingAgents: z.array(z.string()),
  home: z.string(),
  folders: z.array(z.string()),
  rules: z.array(z.object({ rule: z.string(), text: z.string() })),
  suggestions: z.array(z.string()),
  note: z.string().optional(),
});

export type LeadAccess = z.infer<typeof leadAccessSchema>;

export function shownPathOf(options: { path: string; home: string }): string {
  const { path, home } = options;
  if (path === home) return "~";
  return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

const leadPath = "/api/lead-permissions";

export function readLeadAccess(
  client: EngineClient,
): Promise<Reply<LeadAccess>> {
  return client.readJson({ path: leadPath, schema: leadAccessSchema });
}

export function saveLeadAccess(options: {
  client: EngineClient;
  access: LeadAccessChoice;
}): Promise<Reply<LeadAccess>> {
  return options.client.readJson({
    path: `${leadPath}/access`,
    method: "PUT",
    schema: leadAccessSchema,
    body: { access: options.access },
  });
}

export function addLeadFolder(options: {
  client: EngineClient;
  folder: string;
}): Promise<Reply<LeadAccess>> {
  return options.client.readJson({
    path: `${leadPath}/folders`,
    schema: leadAccessSchema,
    body: { folder: options.folder },
  });
}

export function removeLeadFolder(options: {
  client: EngineClient;
  folder: string;
}): Promise<Reply<LeadAccess>> {
  return options.client.readJson({
    path: `${leadPath}/folders`,
    method: "DELETE",
    schema: leadAccessSchema,
    body: { folder: options.folder },
  });
}

export function removeLeadRule(options: {
  client: EngineClient;
  rule: string;
}): Promise<Reply<LeadAccess>> {
  return options.client.readJson({
    path: `${leadPath}/rules`,
    method: "DELETE",
    schema: leadAccessSchema,
    body: { rule: options.rule },
  });
}
