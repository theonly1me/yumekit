import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { RunningEngine } from "@yumekit/engine";
import { serverInstructions } from "@yumekit/harness-mcp";
import { z } from "zod";
import { failed, type CommandResult } from "../../commandResult.js";
import { followEngineEvents, type EngineEvents } from "./engineEvents.js";
import { engineRequest } from "./engineRequest.js";

const toolListSchema = z.object({
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      inputSchema: z.looseObject({ type: z.literal("object") }),
    }),
  ),
});

const harnessResultSchema = z.object({
  isError: z.boolean(),
  text: z.string(),
  data: z.record(z.string(), z.unknown()),
  images: z.array(z.object({ mimeType: z.string(), base64: z.string() })),
});

const failureSchema = z.object({ kind: z.string(), message: z.string() });

function noop(): void {
  return undefined;
}

function callResultOf(body: unknown): CallToolResult {
  const result = harnessResultSchema.safeParse(body);
  if (!result.success) {
    const failure = failureSchema.safeParse(body);
    const text = failure.success
      ? `${failure.data.kind}: ${failure.data.message}`
      : "The engine gave an answer that is not a tool result.";
    return { isError: true, content: [{ type: "text", text }] };
  }
  const { isError, text, data, images } = result.data;
  return {
    isError,
    content: [
      ...(text === "" ? [] : [{ type: "text" as const, text }]),
      ...images.map((image) => ({
        type: "image" as const,
        data: image.base64,
        mimeType: image.mimeType,
      })),
    ],
    ...(Object.keys(data).length === 0 ? {} : { structuredContent: data }),
  };
}

function registerTools(options: {
  server: McpServer;
  engine: RunningEngine;
  events: EngineEvents;
  tools: z.infer<typeof toolListSchema>["tools"];
}): void {
  const { server, engine, events } = options;
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: options.tools,
  }));
  server.server.setRequestHandler(
    CallToolRequestSchema,
    async (...parameters) => {
      const [request, extra] = parameters;
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
  const listed = toolListSchema.safeParse(
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
  return { kind: "serving" };
}
