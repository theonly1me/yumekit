import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface PictureFile {
  path: string;
  kind: "image";
  width_pixels: number;
  height_pixels: number;
}

export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

export const failureKindKey = "yumekit/failure";
export const usageLimitFailureKind = "usage-limit-reached";

const plainFileStem = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function successResult(file: PictureFile): CallToolResult {
  const result = { files: [file], cost_usd: 0 };
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
    structuredContent: { ...result },
  };
}

export function errorResult(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

export function usageLimitResult(message: string): CallToolResult {
  return {
    ...errorResult(message),
    _meta: { [failureKindKey]: usageLimitFailureKind },
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function checkFileStem(fileStem: string): Outcome<string, string> {
  if (!plainFileStem.test(fileStem) || fileStem.includes("..")) {
    return {
      ok: false,
      failure: `file_stem "${fileStem}" must be a plain file name with no path`,
    };
  }
  return { ok: true, value: fileStem };
}

export async function writeOutputFile(options: {
  outputDirectory: string;
  fileStem: string;
  bytes: Buffer;
}): Promise<Outcome<string, string>> {
  const directory = resolve(options.outputDirectory);
  const path = join(directory, `${options.fileStem}.png`);
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(path, options.bytes);
    return { ok: true, value: path };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot write ${path}: ${errorMessage(error)}`,
    };
  }
}
