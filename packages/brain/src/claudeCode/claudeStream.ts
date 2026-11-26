import {
  serverName,
  type BrainEvent,
  type StreamParser,
  type StreamStep,
  type TurnEnd,
} from "../brainTypes.js";
import { jsonLineOf } from "../program/jsonLine.js";
import { claudeServerToolPrefix } from "./claudeAccess.js";
import {
  claudeLineSchema,
  textBlockSchema,
  toolResultBlockSchema,
  toolUseBlockSchema,
  type ClaudeLine,
} from "./claudeEvents.js";

const nothing: StreamStep = { events: [] };

const abortedReason = "aborted_streaming";

function toolNameOf(name: string): string {
  return name.startsWith(claudeServerToolPrefix)
    ? name.slice(claudeServerToolPrefix.length)
    : name;
}

function assistantEventsOf(content: unknown[]): BrainEvent[] {
  const texts: string[] = [];
  const events: BrainEvent[] = [];
  for (const block of content) {
    const text = textBlockSchema.safeParse(block);
    if (text.success) texts.push(text.data.text);
    const toolUse = toolUseBlockSchema.safeParse(block);
    if (toolUse.success) {
      events.push({
        type: "tool-started",
        callId: toolUse.data.id,
        tool: toolNameOf(toolUse.data.name),
        input: toolUse.data.input,
      });
    }
  }
  return texts.length === 0
    ? events
    : [{ type: "text", text: texts.join(""), isPart: false }, ...events];
}

function toolResultEventsOf(content: unknown[]): BrainEvent[] {
  return content.flatMap((block): BrainEvent[] => {
    const result = toolResultBlockSchema.safeParse(block);
    if (!result.success) return [];
    return [
      {
        type: "tool-finished",
        callId: result.data.tool_use_id,
        ok: result.data.is_error !== true,
      },
    ];
  });
}

function initStep(line: Extract<ClaudeLine, { type: "system" }>): StreamStep {
  const session: BrainEvent = {
    type: "session",
    sessionId: line.session_id,
    ...(line.model === undefined ? {} : { model: line.model }),
  };
  const server = line.mcp_servers.find((entry) => entry.name === serverName);
  if (server?.status === "connected") return { events: [session] };
  return {
    events: [session],
    end: {
      kind: "failed",
      reason: "tools",
      message: `Claude Code could not start the yumekit tools (${server?.status ?? "missing"}).`,
    },
    stopProgram: true,
  };
}

function resultEnd(options: {
  line: Extract<ClaudeLine, { type: "result" }>;
  isSignedOut: boolean;
}): TurnEnd {
  const { line } = options;
  if (line.terminal_reason === abortedReason) return { kind: "stopped" };
  if (!line.is_error) {
    return line.total_cost_usd === undefined
      ? { kind: "done" }
      : { kind: "done", costUsd: line.total_cost_usd };
  }
  return {
    kind: "failed",
    reason: options.isSignedOut ? "signed-out" : "program",
    message: line.result ?? "Claude Code stopped with an error.",
  };
}

export function createClaudeStreamParser(): StreamParser {
  let isSignedOut = false;
  return {
    readLine: (text) => {
      const parsed = claudeLineSchema.safeParse(jsonLineOf(text));
      if (!parsed.success) return nothing;
      const line = parsed.data;
      switch (line.type) {
        case "system":
          return initStep(line);
        case "stream_event":
          return {
            events: [
              { type: "text", text: line.event.delta.text, isPart: true },
            ],
          };
        case "assistant":
          if (line.error === "authentication_failed") isSignedOut = true;
          return { events: assistantEventsOf(line.message.content) };
        case "user":
          return typeof line.message.content === "string"
            ? nothing
            : { events: toolResultEventsOf(line.message.content) };
        case "result":
          return { events: [], end: resultEnd({ line, isSignedOut }) };
      }
    },
    endOf: ({ stopRequested }) =>
      stopRequested
        ? { kind: "stopped" }
        : {
            kind: "failed",
            reason: isSignedOut ? "signed-out" : "program",
            message: "Claude Code stopped before it answered.",
          },
  };
}
