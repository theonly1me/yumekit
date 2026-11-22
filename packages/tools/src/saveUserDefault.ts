import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import {
  configurationFileName,
  configurationFileSchema,
} from "./configuration.js";
import { configurationDirectory } from "./configurationDirectory.js";
import { errorMessage } from "./errorMessage.js";
import type { MediaPick, MediaPickFailure } from "./choiceTypes.js";
import type { Outcome } from "./types.js";

const jsonObjectSchema = z.record(z.string(), z.unknown());

type FileObject = Record<string, unknown>;

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readUserObject(
  file: string,
): Promise<Outcome<FileObject, MediaPickFailure>> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return { ok: true, value: {} };
    return notValid({ file, message: errorMessage(error) });
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return notValid({ file, message: errorMessage(error) });
  }
  const checked = configurationFileSchema.safeParse(json);
  if (!checked.success) {
    return notValid({ file, message: z.prettifyError(checked.error) });
  }
  const object = jsonObjectSchema.safeParse(json);
  return object.success
    ? { ok: true, value: object.data }
    : notValid({ file, message: "The file is not one JSON object." });
}

function notValid(options: {
  file: string;
  message: string;
}): Outcome<never, MediaPickFailure> {
  return {
    ok: false,
    failure: { kind: "invalid-configuration-file", ...options },
  };
}

function withPick(options: { file: FileObject; pick: MediaPick }): FileObject {
  const { file, pick } = options;
  const parsedDefaults = jsonObjectSchema.safeParse(file["defaults"]);
  const otherDefaults = Object.fromEntries(
    Object.entries(parsedDefaults.success ? parsedDefaults.data : {}).filter(
      ([capability]) => capability !== pick.capability,
    ),
  );
  if (pick.server === undefined) return { ...file, defaults: otherDefaults };
  const entry =
    pick.model === undefined
      ? pick.server
      : { server: pick.server, model: pick.model };
  const defaults = { ...otherDefaults, [pick.capability]: entry };
  return { ...file, defaults };
}

export async function saveUserDefault(
  pick: MediaPick,
): Promise<Outcome<{ file: string }, MediaPickFailure>> {
  const folder = configurationDirectory();
  const file = join(folder, configurationFileName);
  const read = await readUserObject(file);
  if (!read.ok) return read;
  const temporaryFile = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await mkdir(folder, { recursive: true, mode: 0o700 });
    const text = JSON.stringify(withPick({ file: read.value, pick }), null, 2);
    await writeFile(temporaryFile, `${text}\n`);
    await rename(temporaryFile, file);
  } catch (error) {
    await rm(temporaryFile, { force: true });
    return {
      ok: false,
      failure: {
        kind: "configuration-not-written",
        file,
        message: errorMessage(error),
      },
    };
  }
  return { ok: true, value: { file } };
}
