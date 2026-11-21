import { randomUUID } from "node:crypto";
import {
  access,
  constants,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, delimiter, dirname, join } from "node:path";
import type { Outcome } from "../engineTypes.js";

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export async function readOptionalFile(
  file: string,
): Promise<Outcome<string | undefined, string>> {
  try {
    return { ok: true, value: await readFile(file, "utf8") };
  } catch (error) {
    return isMissingFile(error)
      ? { ok: true, value: undefined }
      : { ok: false, failure: errorMessageOf(error) };
  }
}

export async function writeFileAtomic(options: {
  file: string;
  content: string;
}): Promise<Outcome<{ written: true }, string>> {
  const temporaryFile = join(
    dirname(options.file),
    `.${basename(options.file)}.${randomUUID()}.partial`,
  );
  try {
    await mkdir(dirname(options.file), { recursive: true });
    await writeFile(temporaryFile, options.content);
    await rename(temporaryFile, options.file);
    return { ok: true, value: { written: true } };
  } catch (error) {
    await rm(temporaryFile, { force: true });
    return { ok: false, failure: errorMessageOf(error) };
  }
}

async function isProgram(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

export async function isOnPath(program: string): Promise<boolean> {
  const folders = (process.env["PATH"] ?? "")
    .split(delimiter)
    .filter((folder) => folder !== "");
  for (const folder of folders) {
    if (await isProgram(join(folder, program))) return true;
  }
  return false;
}
