import type { AgentId as BrainAgentId } from "@yumekit/brain";
import { z } from "zod";
import { readOptionalFile, writeFileAtomic } from "../agents/agentFiles.js";
import type { Outcome } from "../engineTypes.js";
import type { ChatFailure } from "./chatTypes.js";
import { settingsFilePath } from "./settings.js";

const settingsFileSchema = z.record(z.string(), z.unknown());

export type AgentSettingFailure =
  ChatFailure | { kind: "settings-not-written"; message: string };

function notValid(file: string): AgentSettingFailure {
  return {
    kind: "settings-not-valid",
    message: `The settings file ${file} is not valid. Correct it or remove it.`,
  };
}

function fieldsOf(text: string): Record<string, unknown> | undefined {
  try {
    const parsed = settingsFileSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function saveAgentSetting(
  agent: BrainAgentId,
): Promise<Outcome<{ agent: BrainAgentId }, AgentSettingFailure>> {
  const file = settingsFilePath();
  const read = await readOptionalFile(file);
  if (!read.ok) return { ok: false, failure: notValid(file) };
  const fields = read.value === undefined ? {} : fieldsOf(read.value);
  if (fields === undefined) return { ok: false, failure: notValid(file) };
  const written = await writeFileAtomic({
    file,
    content: `${JSON.stringify({ ...fields, agent }, undefined, 2)}\n`,
  });
  if (!written.ok) {
    return {
      ok: false,
      failure: {
        kind: "settings-not-written",
        message: `yumekit could not save ${file}: ${written.failure}`,
      },
    };
  }
  return { ok: true, value: { agent } };
}
