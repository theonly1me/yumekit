import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeFileAtomic(options: {
  path: string;
  content: string;
}): Promise<void> {
  await mkdir(dirname(options.path), { recursive: true });
  const temporaryPath = `${options.path}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, options.content);
  await rename(temporaryPath, options.path);
}
