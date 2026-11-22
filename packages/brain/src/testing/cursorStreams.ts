export const cursorMadeUpSessionId = "5c1e0d8a-made-up-session";

export const cursorMadeUpCallId = "call-made-up-1-2\nfc_made-up-1_0";

const otherCallId = "call-made-up-2-2\nfc_made-up-2_0";

function line(value: object): string {
  return JSON.stringify({ ...value, session_id: cursorMadeUpSessionId });
}

function assistant(options: { text: string; extra: object }): string {
  return line({
    type: "assistant",
    message: {
      role: "assistant",
      content: [{ type: "text", text: options.text }],
    },
    ...options.extra,
  });
}

function piece(text: string): string {
  return assistant({ text, extra: { timestamp_ms: 1700000000100 } });
}

function mcpCall(options: { provider: string; result?: object }): object {
  const toolName = options.provider === "yumekit" ? "set_script" : "send_mail";
  return {
    mcpToolCall: {
      args: {
        name: `${options.provider}-${toolName}`,
        args: { script: "ready" },
        toolCallId: "made-up-tool-call",
        providerIdentifier: options.provider,
        toolName,
        serverIdentifier: options.provider,
      },
      description: "A made-up call.",
      ...(options.result === undefined ? {} : { result: options.result }),
    },
    toolCallId: "made-up-tool-call",
    startedAtMs: "1700000000200",
  };
}

function toolCall(options: {
  subtype: "started" | "completed";
  callId: string;
  toolCall: object;
}): string {
  return line({
    type: "tool_call",
    subtype: options.subtype,
    call_id: options.callId,
    tool_call: options.toolCall,
    model_call_id: "made-up-model-call",
    timestamp_ms: 1700000000300,
  });
}

export const cursorInit = line({
  type: "system",
  subtype: "init",
  apiKeySource: "login",
  cwd: "/made/up/folder",
  model: "Auto",
  permissionMode: "default",
});

export const cursorSuccess = {
  success: {
    content: [{ text: { text: "Script set (5 characters)." } }],
    isError: false,
  },
};

export function cursorResult(options: { isError: boolean }): string {
  return line({
    type: "result",
    subtype: options.isError ? "error" : "success",
    duration_ms: 1200,
    is_error: options.isError,
    result: options.isError ? "The model is busy." : "I will set it. Done.",
    request_id: "made-up-request",
    usage: { inputTokens: 1, outputTokens: 1 },
  });
}

export function cursorChangeStream(yumekitResult: object): string[] {
  return [
    cursorInit,
    line({ type: "user", message: { role: "user", content: [] } }),
    line({ type: "thinking", subtype: "delta", text: "Plan." }),
    line({ type: "thinking", subtype: "completed" }),
    piece("I will"),
    piece(" set it."),
    assistant({
      text: "I will set it.",
      extra: {
        model_call_id: "made-up-model-call",
        timestamp_ms: 1700000000150,
      },
    }),
    toolCall({
      subtype: "started",
      callId: "call-list",
      toolCall: { getMcpToolsToolCall: { args: {} } },
    }),
    toolCall({
      subtype: "started",
      callId: cursorMadeUpCallId,
      toolCall: mcpCall({ provider: "yumekit" }),
    }),
    toolCall({
      subtype: "completed",
      callId: cursorMadeUpCallId,
      toolCall: mcpCall({
        provider: "yumekit",
        result: yumekitResult,
      }),
    }),
    toolCall({
      subtype: "completed",
      callId: otherCallId,
      toolCall: mcpCall({
        provider: "mail",
        result: {
          rejected: { reason: "User rejected MCP", isReadonly: false },
        },
      }),
    }),
    toolCall({
      subtype: "started",
      callId: "call-shell",
      toolCall: { shellToolCall: { args: { command: "touch made.txt" } } },
    }),
    "this line is not JSON",
    piece(" Done."),
    assistant({ text: " Done.", extra: {} }),
    cursorResult({ isError: false }),
  ];
}
