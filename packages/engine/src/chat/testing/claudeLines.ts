export const madeUpSessionId = "5f1c-made-up-session";

function line(value: object): string {
  return JSON.stringify(value);
}

export const init = line({
  type: "system",
  subtype: "init",
  session_id: madeUpSessionId,
  mcp_servers: [{ name: "yumekit", status: "connected" }],
});

export function part(text: string): string {
  return line({
    type: "stream_event",
    event: {
      type: "content_block_delta",
      delta: { type: "text_delta", text },
    },
  });
}

export function whole(text: string): string {
  return line({
    type: "assistant",
    message: { content: [{ type: "text", text }] },
  });
}

export function toolUse(options: {
  callId: string;
  tool: string;
  input?: Record<string, unknown>;
}): string {
  return line({
    type: "assistant",
    message: {
      content: [
        {
          type: "tool_use",
          id: options.callId,
          name: `mcp__yumekit__${options.tool}`,
          input: options.input ?? {},
        },
      ],
    },
  });
}

export function toolResult(options: {
  callId: string;
  isError: boolean;
}): string {
  return line({
    type: "user",
    message: {
      content: [
        {
          type: "tool_result",
          tool_use_id: options.callId,
          is_error: options.isError,
        },
      ],
    },
  });
}

export function result(terminalReason: string): string {
  return line({
    type: "result",
    is_error: terminalReason !== "completed",
    terminal_reason: terminalReason,
    total_cost_usd: 0.002,
    result: "",
  });
}
