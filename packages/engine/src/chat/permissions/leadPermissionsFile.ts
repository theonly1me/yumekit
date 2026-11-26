import { join } from "node:path";
import { z } from "zod";
import { readOptionalFile, writeFileAtomic } from "../../agents/agentFiles.js";

const leadPermissionsSchema = z.object({
  folders: z.array(z.string().min(1)).default([]),
  rules: z.array(z.string().min(1)).default([]),
});

export type LeadPermissions = z.infer<typeof leadPermissionsSchema>;

const nothingAllowed: LeadPermissions = { folders: [], rules: [] };

export function leadPermissionsFileOf(projectFolder: string): string {
  return join(projectFolder, ".yumekit", "lead-permissions.json");
}

function permissionsOf(text: string): LeadPermissions {
  try {
    const parsed = leadPermissionsSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : nothingAllowed;
  } catch {
    return nothingAllowed;
  }
}

export async function readLeadPermissions(
  projectFolder: string,
): Promise<LeadPermissions> {
  const read = await readOptionalFile(leadPermissionsFileOf(projectFolder));
  return read.ok && read.value !== undefined
    ? permissionsOf(read.value)
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
  const written = await writeFileAtomic({
    file: leadPermissionsFileOf(options.projectFolder),
    content: `${JSON.stringify(changed, undefined, 2)}\n`,
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
