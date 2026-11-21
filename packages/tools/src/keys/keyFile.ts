import { randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { configurationDirectory } from "../configurationDirectory.js";
import { errorMessage } from "../errorMessage.js";
import type { Outcome } from "../types.js";

export const keyFileMode = 0o600;
export const keyFolderMode = 0o700;

const keyFileSchema = z.record(z.string(), z.string());

export type KeyValues = Record<string, string>;

export interface KeyFileProblem {
  file: string;
  message: string;
}

export function keyFilePath(): string {
  return join(configurationDirectory(), "keys.json");
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function correctMode(file: string): Promise<void> {
  const { mode } = await stat(file);
  const isReadableByOthers = (mode & 0o077) !== 0;
  if (isReadableByOthers) await chmod(file, keyFileMode);
}

export async function readKeyFile(): Promise<
  Outcome<KeyValues, KeyFileProblem>
> {
  const file = keyFilePath();
  let text: string;
  try {
    text = await readFile(file, "utf8");
    await correctMode(file);
  } catch (error) {
    if (isMissingFile(error)) return { ok: true, value: {} };
    return { ok: false, failure: { file, message: errorMessage(error) } };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return { ok: false, failure: { file, message: errorMessage(error) } };
  }
  const parsed = keyFileSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        file,
        message: "The file must hold one object from names to text values",
      },
    };
  }
  return { ok: true, value: parsed.data };
}

export async function writeKeyFile(
  values: KeyValues,
): Promise<Outcome<{ written: true }, KeyFileProblem>> {
  const file = keyFilePath();
  const temporaryFile = join(
    dirname(file),
    `.keys.json.${randomUUID()}.partial`,
  );
  try {
    await mkdir(dirname(file), { recursive: true, mode: keyFolderMode });
    await chmod(dirname(file), keyFolderMode);
    await writeFile(temporaryFile, `${JSON.stringify(values, null, 2)}\n`, {
      mode: keyFileMode,
    });
    await rename(temporaryFile, file);
    return { ok: true, value: { written: true } };
  } catch (error) {
    await rm(temporaryFile, { force: true });
    return { ok: false, failure: { file, message: errorMessage(error) } };
  }
}
