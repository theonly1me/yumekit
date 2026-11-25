import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface VideoFile {
  path: string;
  kind: "video";
  width_pixels?: number;
  height_pixels?: number;
  duration_seconds?: number;
}

export interface VideoToolResult {
  files: VideoFile[];
  cost_usd?: number;
  cost_is_estimate?: boolean;
}

export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

const plainFileStem = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function successResult(structuredContent: object): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent) }],
    structuredContent: { ...structuredContent },
  };
}

const quotaCode = "RESOURCE_EXHAUSTED";

export function errorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
    ...(message.includes(quotaCode)
      ? { _meta: { "yumekit/failure": "service-quota" } }
      : {}),
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
  extension: string;
  bytes: Buffer;
}): Promise<Outcome<string, string>> {
  const directory = resolve(options.outputDirectory);
  const path = join(directory, `${options.fileStem}.${options.extension}`);
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
