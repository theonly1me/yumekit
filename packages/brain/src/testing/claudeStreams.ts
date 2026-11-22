const sessionId = "0b7d3c52-made-up-session";

function line(value: object): string {
  return JSON.stringify(value);
}

export function claudeInit(status: string): string {
  return line({
    type: "system",
    subtype: "init",
    session_id: sessionId,
    mcp_servers: [{ name: "yumekit", status }],
    model: "made-up-model",
  });
}

export function claudeDelta(text: string): string {
  return line({
    type: "stream_event",
    session_id: sessionId,
    event: {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    },
  });
}

export function claudeText(text: string): string {
  return line({
    type: "assistant",
    session_id: sessionId,
    message: { role: "assistant", content: [{ type: "text", text }] },
  });
}

export const claudeToolUse = line({
  type: "assistant",
  session_id: sessionId,
  message: {
    role: "assistant",
    content: [
      {
        type: "tool_use",
        id: "toolu_made_up_1",
        name: "mcp__yumekit__set_script",
        input: { text: "ready" },
      },
    ],
  },
});

export const claudeToolResult = line({
  type: "user",
  session_id: sessionId,
  message: {
    role: "user",
    content: [
      {
        tool_use_id: "toolu_made_up_1",
        type: "tool_result",
        content: [{ type: "text", text: "The script is set." }],
      },
    ],
  },
});

export function claudeResult(options: {
  isError: boolean;
  terminalReason: string;
  result: string;
}): string {
  return line({
    type: "result",
    subtype: options.isError ? "error_during_execution" : "success",
    is_error: options.isError,
    terminal_reason: options.terminalReason,
    total_cost_usd: 0.0125,
    result: options.result,
    session_id: sessionId,
  });
}

export const claudeChangeStream = [
  claudeInit("connected"),
  line({ type: "system", subtype: "status", status: "requesting" }),
  claudeDelta("I will set "),
  claudeDelta("the script."),
  claudeText("I will set the script."),
  claudeToolUse,
  claudeToolResult,
  line({ type: "rate_limit_event", rate_limit_info: { status: "allowed" } }),
  "this line is not JSON",
  claudeText("The script now says ready."),
  claudeResult({
    isError: false,
    terminalReason: "completed",
    result: "The script now says ready.",
  }),
];

export const claudeSignedOutStream = [
  claudeInit("connected"),
  line({
    type: "assistant",
    error: "authentication_failed",
    message: {
      role: "assistant",
      content: [{ type: "text", text: "Not logged in. Please run /login" }],
    },
  }),
  claudeResult({
    isError: true,
    terminalReason: "api_error",
    result: "Not logged in. Please run /login",
  }),
];

export const claudeMadeUpSessionId = sessionId;
