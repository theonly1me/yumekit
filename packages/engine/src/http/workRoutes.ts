import type { Exchange, Route } from "./exchange.js";
import { sendJson } from "./responses.js";

function listWork(exchange: Exchange): Promise<undefined> {
  sendJson({
    response: exchange.response,
    status: 200,
    body: { items: exchange.context.harness.work.items() },
  });
  return Promise.resolve(undefined);
}

export const workRoutes: Route[] = [
  { method: "GET", pattern: ["api", "work"], handle: listWork },
];
