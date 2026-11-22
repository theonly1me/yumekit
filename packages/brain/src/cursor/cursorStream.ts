import {
  serverName,
  type BrainEvent,
  type StreamParser,
  type StreamStep,
  type TurnEnd,
} from "../brainTypes.js";
import { jsonLineOf } from "../program/jsonLine.js";
import {
  cursorLineSchema,
  mcpToolCallSchema,
  textBlockSchema,
  type CursorLine,
} from "./cursorEvents.js";

const nothing: StreamStep = { events: [] };

function assistantEventsOf(
  line: Extract<CursorLine, { type: "assistant" }>,
): BrainEvent[] {
  const texts = line.message.content.flatMap((block) => {
    const text = textBlockSchema.safeParse(block);
    return text.success ? [text.data.text] : [];
  });
  if (texts.length === 0) return [];
  const isPart =
    line.timestamp_ms !== undefined && line.model_call_id === undefined;
  return [{ type: "text", text: texts.join(""), isPart }];
}

function toolCallEventsOf(
  line: Extract<CursorLine, { type: "tool_call" }>,
): BrainEvent[] {
  const call = mcpToolCallSchema.safeParse(line.tool_call);
  if (!call.success) return [];
  const { args, result } = call.data.mcpToolCall;
  if (args.providerIdentifier !== serverName) return [];
  if (line.subtype === "started") {
    return [
      {
        type: "tool-started",
        callId: line.call_id,
        tool: args.toolName,
        input: args.args,
      },
    ];
  }
  const ok = result?.success?.isError === false;
  return [{ type: "tool-finished", callId: line.call_id, ok }];
}

function resultEnd(line: Extract<CursorLine, { type: "result" }>): TurnEnd {
  if (!line.is_error) return { kind: "done" };
  return {
    kind: "failed",
    reason: "program",
    message:
      line.result === undefined || line.result === ""
        ? "Cursor stopped with an error."
        : line.result,
  };
}

export function createCursorStreamParser(): StreamParser {
  return {
    readLine: (text) => {
      const parsed = cursorLineSchema.safeParse(jsonLineOf(text));
      if (!parsed.success) return nothing;
      const line = parsed.data;
      switch (line.type) {
        case "system":
          return { events: [{ type: "session", sessionId: line.session_id }] };
        case "assistant":
          return { events: assistantEventsOf(line) };
        case "tool_call":
          return { events: toolCallEventsOf(line) };
        case "result":
          return { events: [], end: resultEnd(line) };
      }
    },
    endOf: ({ stopRequested, lastErrorLine }) =>
      stopRequested
        ? { kind: "stopped" }
        : {
            kind: "failed",
            reason: "program",
            message: lastErrorLine ?? "Cursor stopped before it answered.",
          },
  };
}
