import type { Exchange, Route } from "./exchange.js";
import { sendJson } from "./responses.js";

async function getRequests(exchange: Exchange) {
  const read = await exchange.context.mediaTools.requests();
  if (!read.ok) {
    return {
      status: 409,
      kind: read.failure.kind,
      message: `The record of requests ${read.failure.file} is not valid: ${read.failure.message}`,
    };
  }
  sendJson({
    response: exchange.response,
    status: 200,
    body: { requests: read.value },
  });
  return undefined;
}

export const mediaRequestRoutes: Route[] = [
  { method: "GET", pattern: ["api", "media", "requests"], handle: getRequests },
];
