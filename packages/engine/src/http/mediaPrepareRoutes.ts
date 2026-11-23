import { z } from "zod";
import type { Exchange, Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson } from "./responses.js";

const prepareBodySchema = z.strictObject({
  server: z.string().min(1),
  model: z.string().min(1).optional(),
  callId: z.string().min(1).max(200).optional(),
});

const prepareFailureStatus = {
  "server-not-found": 404,
  "nothing-to-prepare": 400,
  "server-failed-to-start": 502,
  "media-tool-failed": 502,
} as const;

async function prepareModel(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: prepareBodySchema,
  });
  if (!body.ok) return body.failure;
  const { server, model, callId } = body.value;
  const { events, mediaTools } = exchange.context;
  const prepared = await mediaTools.prepare({
    server,
    ...(model === undefined ? {} : { model }),
    ...(callId === undefined
      ? {}
      : {
          onProgress: (progress) => {
            events.send({ type: "call-progress", callId, ...progress });
          },
        }),
  });
  if (!prepared.ok) {
    const { failure } = prepared;
    return {
      status: prepareFailureStatus[failure.kind],
      kind: failure.kind,
      message:
        "message" in failure
          ? failure.message
          : `The server "${failure.server}" has nothing to download.`,
    };
  }
  sendJson({ response: exchange.response, status: 200, body: { ready: true } });
  return undefined;
}

export const mediaPrepareRoutes: Route[] = [
  {
    method: "POST",
    pattern: ["api", "media", "prepare"],
    handle: prepareModel,
  },
];
