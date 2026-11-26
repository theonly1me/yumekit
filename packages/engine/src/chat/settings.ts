import { join } from "node:path";
import { configurationDirectory } from "@yumekit/tools";
import { z } from "zod";
import { readOptionalFile } from "../agents/agentFiles.js";
import { agentIds } from "../agents/agentTypes.js";
import type { Outcome } from "../engineTypes.js";

export const aiRoles = ["lead", "critic"] as const;

export type AiRole = (typeof aiRoles)[number];

export const leadAccessChoices = ["ask-me", "yumekit-only"] as const;

export type LeadAccessChoice = (typeof leadAccessChoices)[number];

const modelChoiceSchema = z.strictObject({
  model: z.string().min(1).optional(),
  effort: z.string().min(1).optional(),
});

const settingsSchema = z.looseObject({
  agent: z.enum(agentIds).optional(),
  agentPrograms: z
    .partialRecord(z.enum(agentIds), z.string().min(1))
    .optional(),
  models: z
    .partialRecord(
      z.enum(agentIds),
      z.partialRecord(z.enum(aiRoles), modelChoiceSchema),
    )
    .optional(),
  leadAccess: z.enum(leadAccessChoices).optional(),
});

export type ChatSettings = z.infer<typeof settingsSchema>;

export function settingsFilePath(): string {
  return join(configurationDirectory(), "settings.json");
}

function settingsOf(text: string): ChatSettings | undefined {
  try {
    const parsed = settingsSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function readChatSettings(): Promise<
  Outcome<ChatSettings, { file: string }>
> {
  const file = settingsFilePath();
  const read = await readOptionalFile(file);
  if (!read.ok) return { ok: false, failure: { file } };
  if (read.value === undefined) return { ok: true, value: {} };
  const settings = settingsOf(read.value);
  return settings === undefined
    ? { ok: false, failure: { file } }
    : { ok: true, value: settings };
}
