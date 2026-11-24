import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { capabilities } from "../convention.js";
import { errorMessage } from "../errorMessage.js";
import type { Outcome } from "../types.js";

export const costBases = ["reported", "catalog", "cautious"] as const;

const ledgerEntrySchema = z.object({
  at: z.string(),
  server: z.string(),
  model: z.string().optional(),
  capability: z.enum(capabilities),
  file_stem: z.string(),
  usd: z.number().nonnegative(),
  basis: z.enum(costBases),
  timed_out: z.boolean().optional(),
});

const ledgerFileSchema = z.object({ entries: z.array(ledgerEntrySchema) });

export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
export type CostBasis = LedgerEntry["basis"];

export function ledgerFileOf(projectFolder: string): string {
  return join(projectFolder, ".yumekit", "spending.json");
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export interface SpendingRecordNotValid {
  kind: "spending-record-not-valid";
  file: string;
  message: string;
}

function notValid(options: {
  file: string;
  message: string;
}): Outcome<LedgerEntry[], SpendingRecordNotValid> {
  return {
    ok: false,
    failure: { kind: "spending-record-not-valid", ...options },
  };
}

export async function readLedger(
  file: string,
): Promise<Outcome<LedgerEntry[], SpendingRecordNotValid>> {
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
  const parsed = ledgerFileSchema.safeParse(json);
  if (!parsed.success) {
    return notValid({ file, message: z.prettifyError(parsed.error) });
  }
  return { ok: true, value: parsed.data.entries };
}

export async function writeLedger(options: {
  file: string;
  entries: LedgerEntry[];
}): Promise<void> {
  const { file, entries } = options;
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ entries }, null, 2)}\n`);
  await rename(temporary, file);
}
