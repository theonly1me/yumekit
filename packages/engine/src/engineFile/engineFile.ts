import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

function isFileExistsError(error: unknown): boolean {
  return error instanceof Error && Reflect.get(error, "code") === "EEXIST";
}

export async function createEngineFileExclusively(options: {
  projectFolder: string;
  content: EngineFileContent;
}): Promise<boolean> {
  await mkdir(engineFolderOf(options.projectFolder), {
    recursive: true,
    mode: 0o700,
  });
  const path = engineFilePathOf(options.projectFolder);
  try {
    await writeFile(path, JSON.stringify(options.content), {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if (isFileExistsError(error)) return false;
    throw error;
  }
  await chmod(path, 0o600);
  return true;
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
