import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { WordTiming } from "./audio/wordTimings.ts";

export interface MediaFile {
  path: string;
  kind: "image" | "audio" | "video";
  width_pixels?: number;
  height_pixels?: number;
  duration_seconds?: number;
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function prepareOutputPath(options: {
  outputDirectory: string;
  fileStem: string;
  extension: string;
}): Promise<Outcome<string, string>> {
  if (
    !plainFileStem.test(options.fileStem) ||
    options.fileStem.includes("..")
  ) {
    return {
      ok: false,
      failure: `file_stem "${options.fileStem}" must be a plain file name with no path`,
    };
  }
  const directory = resolve(options.outputDirectory);
  try {
    await mkdir(directory, { recursive: true });
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot make ${directory}: ${errorMessage(error)}`,
    };
  }
  return {
    ok: true,
    value: join(directory, `${options.fileStem}.${options.extension}`),
  };
}

export async function writeOutputFile(options: {
  outputDirectory: string;
  fileStem: string;
  extension: string;
  bytes: Buffer;
}): Promise<Outcome<string, string>> {
  const prepared = await prepareOutputPath(options);
  if (!prepared.ok) return prepared;
  const path = prepared.value;
  try {
    await writeFile(path, options.bytes);
    return { ok: true, value: path };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot write ${path}: ${errorMessage(error)}`,
    };
  }
}
