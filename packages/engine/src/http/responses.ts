import type { ServerResponse } from "node:http";
import type { Rejection } from "./requestChecks.js";

export interface Failure {
  status: number;
  kind: string;
  message: string;
}

export function setSafeHeaders(response: ServerResponse): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

export function sendJson(options: {
  response: ServerResponse;
  status: number;
  body: unknown;
}): void {
  const text = JSON.stringify(options.body);
  options.response.writeHead(options.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
  });
  options.response.end(text);
}

export function sendFailure(options: {
  response: ServerResponse;
  failure: Failure | Rejection;
}): void {
  const { status, kind, message } = options.failure;
  sendJson({ response: options.response, status, body: { kind, message } });
}

export function notFound(message: string): Failure {
  return { status: 404, kind: "not-found", message };
}

export const methodNotAllowed: Failure = {
  status: 405,
  kind: "method-not-allowed",
  message: "The path does not accept this method.",
};
