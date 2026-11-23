import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  McpError,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import type { RunningEngine } from "@yumekit/engine";
import { serverInstructions } from "@yumekit/harness-mcp";
import { z } from "zod";
import { failed, type CommandResult } from "../../commandResult.js";
import { stopOnEnd } from "../../ending/stopOnEnd.js";
import { followEngineEvents, type EngineEvents } from "./engineEvents.js";
import { engineRequest } from "./engineRequest.js";

const engineResultSchema = z.object({ mcpResult: z.unknown() });

const failureSchema = z.object({ kind: z.string(), message: z.string() });

function noop(): void {
  return undefined;
}

function callResultOf(body: unknown): CallToolResult {
  const engineResult = engineResultSchema.safeParse(body);
  const result = CallToolResultSchema.safeParse(
    engineResult.success ? engineResult.data.mcpResult : undefined,
  );
  if (result.success) return result.data;
  const failure = failureSchema.safeParse(body);
  const text = failure.success
    ? `${failure.data.kind}: ${failure.data.message}`
    : "The engine gave an answer that is not a tool result.";
  return { isError: true, content: [{ type: "text", text }] };
}

function toolNotFound(name: string): CallToolResult {
  const error = new McpError(ErrorCode.InvalidParams, `Tool ${name} not found`);
  return { isError: true, content: [{ type: "text", text: error.message }] };
}

function registerTools(options: {
  server: McpServer;
  engine: RunningEngine;
  events: EngineEvents;
  tools: Tool[];
}): void {
  const { server, engine, events } = options;
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: options.tools.map((tool) => ({
      ...tool,
      execution: { taskSupport: "forbidden" as const },
    })),
  }));
  server.server.setRequestHandler(
    CallToolRequestSchema,
    async (...parameters) => {
      const [request, extra] = parameters;
      if (!options.tools.some((tool) => tool.name === request.params.name)) {
        return toolNotFound(request.params.name);
      }
      const progressToken = request.params._meta?.progressToken;
      const callId = progressToken === undefined ? undefined : randomUUID();
      const stopFollowing =
        callId === undefined || progressToken === undefined
          ? noop
          : events.onProgress({
              callId,
              listener: ({ done, total, message }) => {
                extra
                  .sendNotification({
                    method: "notifications/progress",
                    params: {
                      progressToken,
                      progress: done,
                      ...(total === undefined ? {} : { total }),
                      ...(message === undefined ? {} : { message }),
                    },
                  })
                  .catch(noop);
              },
            });
      try {
        const answer = await engineRequest({
          engine,
          method: "POST",
          path: `/api/tools/${encodeURIComponent(request.params.name)}`,
          body: {
            input: request.params.arguments ?? {},
            ...(callId === undefined ? {} : { callId }),
          },
        });
        return callResultOf(answer.body);
      } finally {
        stopFollowing();
      }
    },
  );
}

export async function serveBridge(
  engine: RunningEngine,
): Promise<CommandResult> {
  const listed = ListToolsResultSchema.safeParse(
    (await engineRequest({ engine, method: "GET", path: "/api/tools" })).body,
  );
  if (!listed.success) {
    return failed(`The engine at ${engine.origin} gave no tool list.`);
  }
  const server = new McpServer(
    { name: "yumekit", version: "0.0.0" },
    { capabilities: { tools: {} }, instructions: serverInstructions },
  );
  const events = await followEngineEvents({
    engine,
    onEngineClosed: () => {
      process.stderr.write("yumekit: the engine stopped.\n");
      server.close().catch(noop);
    },
  });
  if (events === undefined) {
    return failed(`The engine at ${engine.origin} sends no events.`);
  }
  registerTools({ server, engine, events, tools: listed.data.tools });
  server.server.onclose = () => {
    events.close();
    process.stdin.destroy();
  };
  await server.connect(new StdioServerTransport());
  stopOnEnd({ close: () => server.close(), endsWithInput: true });
  return { kind: "serving" };
}
