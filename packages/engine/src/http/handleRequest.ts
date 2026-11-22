import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from "node:http";
import { sendStaticFile } from "../files/staticFiles.js";
import { anySegment, type Route } from "./exchange.js";
import {
  bearerTokenOf,
  siteRejectionOf,
  tokenRejectionOf,
} from "./requestChecks.js";
import { requestPathOf, type RequestPath } from "./requestPath.js";
import {
  methodNotAllowed,
  notFound,
  sendFailure,
  setSafeHeaders,
  type Failure,
} from "./responses.js";

export interface RequestHandlerOptions<Context> {
  context: Context;
  routes: Route<Context>[];
  port: number;
  token: string;
  editorFolder: string | undefined;
}

const upgradeRequired: Failure = {
  status: 426,
  kind: "upgrade-required",
  message: "The event path needs a WebSocket.",
};

function parametersOf<Context>(options: {
  route: Route<Context>;
  segments: string[];
}): string[] | undefined {
  const { pattern } = options.route;
  if (pattern.length !== options.segments.length) return undefined;
  const parameters: string[] = [];
  for (const [index, part] of pattern.entries()) {
    const segment = options.segments[index] ?? "";
    if (part === anySegment && segment !== "") parameters.push(segment);
    else if (part !== segment) return undefined;
  }
  return parameters;
}

async function handleApi<Context>(options: {
  request: IncomingMessage;
  response: ServerResponse;
  path: RequestPath;
  handler: RequestHandlerOptions<Context>;
}): Promise<Failure | undefined> {
  const { request, response, path, handler } = options;
  const tokenRejection = tokenRejectionOf({
    given: bearerTokenOf(request),
    token: handler.token,
  });
  if (tokenRejection !== undefined) return tokenRejection;
  if (path.segments.join("/") === "api/events") return upgradeRequired;
  const method = request.method === "HEAD" ? "GET" : request.method;
  const matches = handler.routes.flatMap((route) => {
    const parameters = parametersOf({ route, segments: path.segments });
    return parameters === undefined ? [] : [{ route, parameters }];
  });
  if (matches.length === 0) return notFound("The engine has no such path.");
  const match = matches.find((candidate) => candidate.route.method === method);
  if (match === undefined) return methodNotAllowed;
  return match.route.handle({
    request,
    response,
    context: handler.context,
    parameters: match.parameters,
    query: path.query,
  });
}

async function handle<Context>(options: {
  request: IncomingMessage;
  response: ServerResponse;
  handler: RequestHandlerOptions<Context>;
}): Promise<Failure | undefined> {
  const { request, response, handler } = options;
  const siteRejection = siteRejectionOf({ request, port: handler.port });
  if (siteRejection !== undefined) return siteRejection;
  const path = requestPathOf(request.url);
  if (!path.ok) return path.failure;
  if (path.value.segments[0] === "api") {
    return handleApi({ request, response, path: path.value, handler });
  }
  return sendStaticFile({
    request,
    response,
    editorFolder: handler.editorFolder,
    segments: path.value.segments,
  });
}

const engineDefect: Failure = {
  status: 500,
  kind: "engine-defect",
  message: "The engine failed to answer the request.",
};

export function createRequestHandler<Context>(
  handler: RequestHandlerOptions<Context>,
): RequestListener {
  return (...parameters) => {
    const [request, response] = parameters;
    setSafeHeaders(response);
    handle({ request, response, handler })
      .catch(() => engineDefect)
      .then((failure) => {
        if (failure === undefined) return;
        if (response.headersSent) response.destroy();
        else sendFailure({ response, failure });
      })
      .catch(() => {
        response.destroy();
      });
  };
}
