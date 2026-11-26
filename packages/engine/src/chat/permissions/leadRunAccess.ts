import { join } from "node:path";
import { askingAgentIds, type AgentId, type RunAccess } from "@yumekit/brain";
import type { Outcome } from "../../engineTypes.js";
import {
  changeSettingsFile,
  type AgentSettingFailure,
} from "../agentSetting.js";
import { readChatSettings, type LeadAccessChoice } from "../settings.js";
import { keysFoldersOf } from "./accessFolders.js";
import { readLeadPermissions } from "./leadPermissionsFile.js";

export const defaultLeadAccess: LeadAccessChoice = "ask-me";

const storeFiles = [
  "project.json",
  "bible.json",
  "script.md",
  join("assets", "index.json"),
  "takes.json",
];

const storeFolders = ["scenes", "timelines", ".yumekit"];

export interface LeadRun {
  access: RunAccess;
  workingFolder: string;
}

export async function readLeadAccess(): Promise<LeadAccessChoice> {
  const settings = await readChatSettings();
  return settings.ok
    ? (settings.value.leadAccess ?? defaultLeadAccess)
    : defaultLeadAccess;
}

export function saveLeadAccess(
  choice: LeadAccessChoice,
): Promise<Outcome<{ access: LeadAccessChoice }, AgentSettingFailure>> {
  return changeSettingsFile({
    change: (fields) => ({
      fields: { ...fields, leadAccess: choice },
      value: { access: choice },
    }),
  });
}

export function canAskThePerson(agentId: AgentId): boolean {
  return askingAgentIds.includes(agentId);
}

export async function leadRunOf(options: {
  projectFolder: string;
  agentId: AgentId;
}): Promise<LeadRun> {
  const { projectFolder } = options;
  const choice = await readLeadAccess();
  if (choice === "yumekit-only" || !canAskThePerson(options.agentId)) {
    return {
      access: { kind: "yumekit-only" },
      workingFolder: join(projectFolder, ".yumekit", "agent"),
    };
  }
  const stored = await readLeadPermissions(projectFolder);
  return {
    access: {
      kind: "program",
      readFolders: stored.folders,
      closedFolders: await keysFoldersOf(),
      readOnly: {
        files: storeFiles.map((file) => join(projectFolder, file)),
        folders: storeFolders.map((folder) => join(projectFolder, folder)),
      },
      allowedRules: stored.rules,
    },
    workingFolder: projectFolder,
  };
}
