import { z } from "zod";
import { personSummaryOf } from "../chat/personSummary.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { notFound, sendJson } from "./responses.js";

const toolCallSchema = z.strictObject({
  input: z.record(z.string(), z.json()),
  callId: z.string().min(1).max(200).optional(),
  actId: z.string().min(1).max(200).optional(),
});

export const clientHeader = "x-yumekit-client";
export const agentClient = "agent";

function sendBody(options: { exchange: Exchange; body: unknown }): void {
  sendJson({
    response: options.exchange.response,
    status: 200,
    body: options.body,
  });
}

async function callTool(exchange: Exchange) {
  const { context } = exchange;
  const [name = ""] = exchange.parameters;
  if (!context.harness.tools.some((tool) => tool.name === name)) {
    return {
      status: 404,
      kind: "tool-not-found",
      message: `The harness has no tool "${name}".`,
    };
  }
  const body = await readJsonBody({
    request: exchange.request,
    schema: toolCallSchema,
  });
  if (!body.ok) return body.failure;
  const { input, callId, actId } = body.value;
  const isAgent = exchange.request.headers[clientHeader] === agentClient;
  const result = await context.chat.runToolCall({
    caller: isAgent
      ? { by: "ai", tool: name }
      : {
          by: "person",
          tool: name,
          summary: personSummaryOf({
            tool: name,
            input,
            snapshot: context.store.read(),
          }),
          ...(actId === undefined ? {} : { actId }),
        },
    call: () =>
      context.harness.call({
        name,
        input,
        ...(callId === undefined
          ? {}
          : {
              onProgress: (progress) => {
                context.events.send({
                  type: "call-progress",
                  callId,
                  ...progress,
                });
              },
            }),
      }),
  });
  sendBody({ exchange, body: result });
  return undefined;
}

function previewOf(exchange: Exchange) {
  const { context } = exchange;
  const outputs = context.store.read().project.outputs;
  const outputId = exchange.query.get("output") ?? outputs[0]?.id;
  const output = outputs.find((candidate) => candidate.id === outputId);
  if (output === undefined) {
    return notFound("The project has no such output.");
  }
  const pageUrl = `${context.preview.pageUrlOf(output.id)}&parentOrigin=${encodeURIComponent(context.origin)}`;
  sendBody({ exchange, body: { pageUrl } });
  return undefined;
}

export const projectRoutes: Route[] = [
  {
    method: "GET",
    pattern: ["api", "health"],
    handle: (exchange) => {
      const { context } = exchange;
      sendBody({
        exchange,
        body: {
          name: "yumekit",
          projectFolder: context.projectFolder,
          version: context.version,
        },
      });
      return Promise.resolve(undefined);
    },
  },
  {
    method: "GET",
    pattern: ["api", "project"],
    handle: (exchange) => {
      sendBody({ exchange, body: exchange.context.store.read() });
      return Promise.resolve(undefined);
    },
  },
  {
    method: "GET",
    pattern: ["api", "tools"],
    handle: (exchange) => {
      sendBody({ exchange, body: { tools: exchange.context.harness.tools } });
      return Promise.resolve(undefined);
    },
  },
  { method: "POST", pattern: ["api", "tools", anySegment], handle: callTool },
  {
    method: "GET",
    pattern: ["api", "media-servers"],
    handle: async (exchange) => {
      const listed = await exchange.context.harness.call({
        name: "list_media_tools",
        input: {},
      });
      sendBody({ exchange, body: listed.data });
      return undefined;
    },
  },
  {
    method: "GET",
    pattern: ["api", "preview"],
    handle: (exchange) => Promise.resolve(previewOf(exchange)),
  },
];
