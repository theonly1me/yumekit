import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { isSameToken } from "../http/requestChecks.js";

const engineFileSchema = z.strictObject({
  port: z.int().min(1).max(65_535),
  token: z.string().regex(/^[0-9a-f]{64}$/),
  processId: z.int().min(1),
});

export type EngineFileContent = z.infer<typeof engineFileSchema>;

function engineFolderOf(projectFolder: string): string {
  return join(projectFolder, ".yumekit");
}

export function engineFilePathOf(projectFolder: string): string {
  return join(engineFolderOf(projectFolder), "engine.json");
}

export async function readEngineFile(
  projectFolder: string,
): Promise<EngineFileContent | undefined> {
  try {
    const text = await readFile(engineFilePathOf(projectFolder), "utf8");
    const parsed = engineFileSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function writeEngineFile(options: {
  projectFolder: string;
  content: EngineFileContent;
}): Promise<void> {
  const folder = engineFolderOf(options.projectFolder);
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const temporaryPath = join(
    folder,
    `engine.json.${String(process.pid)}.temporary`,
  );
  await writeFile(temporaryPath, JSON.stringify(options.content), {
    mode: 0o600,
  });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, engineFilePathOf(options.projectFolder));
}

export async function removeEngineFile(options: {
  projectFolder: string;
  token: string;
}): Promise<void> {
  const content = await readEngineFile(options.projectFolder);
  if (
    content === undefined ||
    !isSameToken({ given: content.token, token: options.token })
  ) {
    return;
  }
  await rm(engineFilePathOf(options.projectFolder), { force: true });
}
