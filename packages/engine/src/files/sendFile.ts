import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pipeline } from "node:stream/promises";
import { contentTypeOf } from "./contentTypes.js";

type ByteRange =
  | { kind: "whole" }
  | { kind: "part"; start: number; end: number }
  | { kind: "not-satisfiable" };

export function byteRangeOf(options: {
  header: string | undefined;
  size: number;
}): ByteRange {
  const { header, size } = options;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (match === null) return { kind: "whole" };
  const [, startText = "", endText = ""] = match;
  if (startText === "" && endText === "") return { kind: "whole" };
  if (startText === "") {
    const suffix = Number(endText);
    if (suffix === 0 || size === 0) return { kind: "not-satisfiable" };
    return { kind: "part", start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(startText);
  const end = endText === "" ? size - 1 : Math.min(Number(endText), size - 1);
  return start >= size || start > end
    ? { kind: "not-satisfiable" }
    : { kind: "part", start, end };
}

export async function sendFile(options: {
  request: IncomingMessage;
  response: ServerResponse;
  file: string;
  contentSecurityPolicy: string;
}): Promise<void> {
  const { request, response, file } = options;
  const { size } = await stat(file);
  const range = byteRangeOf({ header: request.headers.range, size });
  response.setHeader("Content-Type", contentTypeOf(file));
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Security-Policy", options.contentSecurityPolicy);
  if (range.kind === "not-satisfiable") {
    response.writeHead(416, { "Content-Range": `bytes */${String(size)}` });
    response.end();
    return;
  }
  const { start, end } =
    range.kind === "part" ? range : { start: 0, end: size - 1 };
  response.writeHead(range.kind === "part" ? 206 : 200, {
    "Content-Length": String(Math.max(0, end - start + 1)),
    ...(range.kind === "part"
      ? {
          "Content-Range": `bytes ${String(start)}-${String(end)}/${String(size)}`,
        }
      : {}),
  });
  if (request.method === "HEAD" || size === 0) {
    response.end();
    return;
  }
  await pipeline(createReadStream(file, { start, end }), response).catch(() => {
    response.destroy();
  });
}
