import type { Exchange, Route } from "./exchange.js";
import { sendJson } from "./responses.js";

async function getClock(exchange: Exchange): Promise<undefined> {
  const clock = await exchange.context.harness.clock();
  sendJson({
    response: exchange.response,
    status: 200,
    body: { clock, now: new Date().toISOString() },
  });
  return undefined;
}

export const clockRoutes: Route[] = [
  { method: "GET", pattern: ["api", "clock"], handle: getClock },
];
