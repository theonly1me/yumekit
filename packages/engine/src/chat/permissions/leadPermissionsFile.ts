import { createHash } from "node:crypto";
import { join } from "node:path";
import { configurationDirectory } from "@yumekit/tools";
import { z } from "zod";
import { readOptionalFile, writeFileAtomic } from "../../agents/agentFiles.js";

const leadPermissionsSchema = z.object({
  project: z.string(),
  folders: z.array(z.string().min(1)).default([]),
  rules: z.array(z.string().min(1)).default([]),
});

export interface LeadPermissions {
  folders: string[];
  rules: string[];
}

const nothingAllowed: LeadPermissions = { folders: [], rules: [] };

export function leadPermissionsFileOf(projectFolder: string): string {
  const projectKey = createHash("sha256")
    .update(projectFolder)
    .digest("hex")
    .slice(0, 32);
  return join(
    configurationDirectory(),
    "lead-permissions",
    `${projectKey}.json`,
  );
}

function permissionsOf(options: {
  text: string;
  projectFolder: string;
}): LeadPermissions {
  try {
    const parsed = leadPermissionsSchema.safeParse(JSON.parse(options.text));
    if (!parsed.success || parsed.data.project !== options.projectFolder) {
      return nothingAllowed;
    }
    return { folders: parsed.data.folders, rules: parsed.data.rules };
  } catch {
    return nothingAllowed;
  }
}

export async function readLeadPermissions(
  projectFolder: string,
): Promise<LeadPermissions> {
  const read = await readOptionalFile(leadPermissionsFileOf(projectFolder));
  return read.ok && read.value !== undefined
    ? permissionsOf({ text: read.value, projectFolder })
    : nothingAllowed;
}

let lastChange: Promise<unknown> = Promise.resolve();

async function writeChange(options: {
  projectFolder: string;
  change: (permissions: LeadPermissions) => LeadPermissions;
}): Promise<LeadPermissions | undefined> {
  const changed = options.change(
    await readLeadPermissions(options.projectFolder),
  );
  const stored = { project: options.projectFolder, ...changed };
  const written = await writeFileAtomic({
    file: leadPermissionsFileOf(options.projectFolder),
    content: `${JSON.stringify(stored, undefined, 2)}\n`,
  });
  return written.ok ? changed : undefined;
}

export function changeLeadPermissions(options: {
  projectFolder: string;
  change: (permissions: LeadPermissions) => LeadPermissions;
}): Promise<LeadPermissions | undefined> {
  const changing = lastChange.then(
    () => writeChange(options),
    () => writeChange(options),
  );
  lastChange = changing;
  return changing;
}

export function withoutRepeats(values: string[]): string[] {
  return [...new Set(values)];
}
