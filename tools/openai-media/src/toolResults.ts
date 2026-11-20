import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface MediaFile {
  path: string;
  kind: "image" | "audio";
  width_pixels?: number;
  height_pixels?: number;
  duration_seconds?: number;
}

export interface WordTiming {
  text: string;
  start_seconds: number;
  end_seconds: number;
}

export interface MediaToolResult {
  files: MediaFile[];
  words?: WordTiming[];
}

export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

const plainFileStem = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function successResult(result: MediaToolResult): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
    structuredContent: { ...result },
  };
}

export function errorResult(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
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
  extension: string;
  bytes: Buffer;
}): Promise<Outcome<string, string>> {
  const fileStem = checkFileStem(options.fileStem);
  if (!fileStem.ok) return fileStem;
  const directory = resolve(options.outputDirectory);
  const path = join(directory, `${fileStem.value}.${options.extension}`);
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
