import { z } from "zod";
import type { BrainEvent, StreamParser, StreamStep } from "../brainTypes.js";
import { jsonLineOf } from "../program/jsonLine.js";

const agentMessageSchema = z.looseObject({
  type: z.literal("agent_message"),
  text: z.string(),
});

const toolCallSchema = z.looseObject({
  type: z.literal("mcp_tool_call"),
  id: z.string(),
  tool: z.string(),
  arguments: z.unknown(),
  error: z.unknown(),
  status: z.string(),
});

const codexLineSchema = z.union([
  z.looseObject({ type: z.literal("thread.started"), thread_id: z.string() }),
  z.looseObject({
    type: z.enum(["item.started", "item.completed"]),
    item: z.unknown(),
  }),
  z.looseObject({ type: z.literal("turn.completed") }),
  z.looseObject({
    type: z.literal("turn.failed"),
    error: z.looseObject({ message: z.string() }).optional(),
  }),
]);

const nothing: StreamStep = { events: [] };

const nestedErrorSchema = z.looseObject({
  error: z.looseObject({ message: z.string().min(1) }),
});

function failureMessageOf(message: string | undefined): string {
  if (message === undefined) return "Codex stopped with an error.";
  const nested = nestedErrorSchema.safeParse(jsonLineOf(message));
  return nested.success ? nested.data.error.message : message;
}

function itemEvents(options: {
  item: unknown;
  isCompleted: boolean;
}): BrainEvent[] {
  const message = agentMessageSchema.safeParse(options.item);
  if (message.success && options.isCompleted) {
    return [{ type: "text", text: message.data.text, isPart: false }];
  }
  const call = toolCallSchema.safeParse(options.item);
  if (!call.success) return [];
  if (!options.isCompleted) {
    return [
      {
        type: "tool-started",
        callId: call.data.id,
        tool: call.data.tool,
        input: call.data.arguments,
      },
    ];
  }
  const ok =
    call.data.status === "completed" &&
    (call.data.error === null || call.data.error === undefined);
  return [{ type: "tool-finished", callId: call.data.id, ok }];
}

export function createCodexStreamParser(): StreamParser {
  return {
    readLine: (text) => {
      const parsed = codexLineSchema.safeParse(jsonLineOf(text));
      if (!parsed.success) return nothing;
      const line = parsed.data;
      switch (line.type) {
        case "thread.started":
          return {
            events: [{ type: "session", sessionId: line.thread_id }],
          };
        case "item.started":
        case "item.completed":
          return {
            events: itemEvents({
              item: line.item,
              isCompleted: line.type === "item.completed",
            }),
          };
        case "turn.completed":
          return { events: [], end: { kind: "done" } };
        case "turn.failed":
          return {
            events: [],
            end: {
              kind: "failed",
              reason: "program",
              message: failureMessageOf(line.error?.message),
            },
          };
      }
    },
    endOf: ({ stopRequested }) =>
      stopRequested
        ? { kind: "stopped" }
        : {
            kind: "failed",
            reason: "program",
            message: "Codex stopped before it answered.",
          },
  };
}
