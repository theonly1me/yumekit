import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { capabilities } from "../convention.js";
import { errorMessage } from "../errorMessage.js";
import { costBases } from "../spending/ledger.js";
import type { Outcome } from "../types.js";

export const pictureRoles = [
  "first-frame",
  "last-frame",
  "reference",
  "media",
] as const;

const settingValueSchema = z.union([z.string(), z.number(), z.boolean()]);

const requestRecordSchema = z.object({
  asset_id: z.string(),
  at: z.string(),
  basis: z.enum(costBases).optional(),
  capability: z.enum(capabilities),
  failure: z.object({ kind: z.string(), message: z.string() }).optional(),
  files: z.array(z.string()).optional(),
  model: z.string().optional(),
  pictures: z.array(z.object({ file: z.string(), role: z.enum(pictureRoles) })),
  prompt_from_you: z.string().optional(),
  seconds: z.number().nonnegative(),
  server: z.string().optional(),
  settings: z.record(z.string(), settingValueSchema),
  shot_id: z.string().optional(),
  usd: z.number().nonnegative().optional(),
});

const requestFileSchema = z.object({ requests: z.array(requestRecordSchema) });

export type MediaRequestRecord = z.infer<typeof requestRecordSchema>;

export type PictureRole = (typeof pictureRoles)[number];

export interface RequestLogNotValid {
  kind: "request-log-not-valid";
  file: string;
  message: string;
}

export const mostRequestsKept = 500;

export function requestFileOf(projectFolder: string): string {
  return join(projectFolder, ".yumekit", "requests.json");
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function notValid(options: {
  file: string;
  message: string;
}): Outcome<never, RequestLogNotValid> {
  return { ok: false, failure: { kind: "request-log-not-valid", ...options } };
}

export async function readRequestFile(
  file: string,
): Promise<Outcome<MediaRequestRecord[], RequestLogNotValid>> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return { ok: true, value: [] };
    return notValid({ file, message: errorMessage(error) });
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return notValid({ file, message: errorMessage(error) });
  }
  const parsed = requestFileSchema.safeParse(json);
  if (!parsed.success) {
    return notValid({ file, message: z.prettifyError(parsed.error) });
  }
  return { ok: true, value: parsed.data.requests };
}

function sortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedKeys);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort((...[[first], [second]]) => (first < second ? -1 : 1))
      .map(([key, entry]) => [key, sortedKeys(entry)]),
  );
}

export async function writeRequestFile(options: {
  file: string;
  requests: MediaRequestRecord[];
}): Promise<void> {
  const { file } = options;
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  const text = JSON.stringify(
    sortedKeys({ requests: options.requests }),
    null,
    2,
  );
  await writeFile(temporary, `${text}\n`);
  await rename(temporary, file);
}
