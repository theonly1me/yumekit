import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export interface Rejection {
  status: 400 | 401 | 403 | 404;
  kind: string;
  message: string;
}

function digestOf(text: string): Buffer {
  return createHash("sha256").update(text).digest();
}

export function isSameToken(options: {
  given: string;
  token: string;
}): boolean {
  return timingSafeEqual(digestOf(options.given), digestOf(options.token));
}

export function ownOriginsOf(port: number): string[] {
  return [
    `http://127.0.0.1:${String(port)}`,
    `http://localhost:${String(port)}`,
  ];
}

export function siteRejectionOf(options: {
  request: IncomingMessage;
  port: number;
}): Rejection | undefined {
  const { headers } = options.request;
  const origins = ownOriginsOf(options.port);
  const host = headers.host?.toLowerCase();
  if (host === undefined || !origins.includes(`http://${host}`)) {
    return {
      status: 403,
      kind: "host-not-permitted",
      message: "The Host header must name this engine.",
    };
  }
  const origin = headers.origin;
  if (origin !== undefined && !origins.includes(origin.toLowerCase())) {
    return {
      status: 403,
      kind: "origin-not-permitted",
      message: "The engine accepts requests only from its own origin.",
    };
  }
  return undefined;
}

export function tokenRejectionOf(options: {
  given: string | undefined;
  token: string;
}): Rejection | undefined {
  if (options.given === undefined || options.given === "") {
    return {
      status: 401,
      kind: "token-missing",
      message: "The request needs the session token.",
    };
  }
  return isSameToken({ given: options.given, token: options.token })
    ? undefined
    : {
        status: 401,
        kind: "token-not-valid",
        message: "The session token is not valid.",
      };
}

export function bearerTokenOf(request: IncomingMessage): string | undefined {
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? "");
  return match?.[1];
}
