import { createWriteStream } from "node:fs";
import type { IncomingMessage } from "node:http";
import { pipeline } from "node:stream/promises";

export const uploadLimitBytes = 500 * 1024 * 1024;

export type ReceivedUpload =
  { kind: "received" } | { kind: "too-large" } | { kind: "ended-early" };

export function isDeclaredTooLarge(request: IncomingMessage): boolean {
  return Number(request.headers["content-length"] ?? "0") > uploadLimitBytes;
}

export async function receiveUpload(options: {
  request: IncomingMessage;
  file: string;
}): Promise<ReceivedUpload> {
  let sizeBytes = 0;
  const keepUnderLimit = async function* (source: AsyncIterable<Buffer>) {
    for await (const chunk of source) {
      sizeBytes += chunk.length;
      if (sizeBytes <= uploadLimitBytes) yield chunk;
    }
  };
  try {
    await pipeline(
      options.request,
      keepUnderLimit,
      createWriteStream(options.file, { flags: "wx" }),
    );
  } catch {
    return { kind: "ended-early" };
  }
  return sizeBytes > uploadLimitBytes
    ? { kind: "too-large" }
    : { kind: "received" };
}
