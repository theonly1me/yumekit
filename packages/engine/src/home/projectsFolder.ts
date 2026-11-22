import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { z } from "zod";
import { readOptionalFile } from "../agents/agentFiles.js";
import { settingsFilePath } from "../chat/settings.js";
import type { Outcome } from "../engineTypes.js";

const settingsSchema = z.looseObject({
  projectsFolder: z.string().min(1).optional(),
});

export interface SettingsNotValid {
  kind: "settings-not-valid";
  message: string;
}

function notValid(file: string): Outcome<string, SettingsNotValid> {
  return {
    ok: false,
    failure: {
      kind: "settings-not-valid",
      message: `The settings file ${file} is not valid. Correct it or remove it.`,
    },
  };
}

function folderOf(text: string): string | undefined {
  if (text === "~") return homedir();
  if (text.startsWith("~/")) return join(homedir(), text.slice(2));
  return isAbsolute(text) ? resolve(text) : undefined;
}

function parsedSettingsOf(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function readProjectsFolder(): Promise<
  Outcome<string, SettingsNotValid>
> {
  const file = settingsFilePath();
  const read = await readOptionalFile(file);
  if (!read.ok) return notValid(file);
  const defaultFolder = join(homedir(), "Documents", "yumekit");
  if (read.value === undefined) return { ok: true, value: defaultFolder };
  const settings = settingsSchema.safeParse(parsedSettingsOf(read.value));
  if (!settings.success) return notValid(file);
  const { projectsFolder } = settings.data;
  if (projectsFolder === undefined) return { ok: true, value: defaultFolder };
  const folder = folderOf(projectsFolder);
  return folder === undefined ? notValid(file) : { ok: true, value: folder };
}
