export const cursorMadeUpSessionId = "7d2a-made-up-cursor-session";

function line(value: object): string {
  return JSON.stringify({ ...value, session_id: cursorMadeUpSessionId });
}

export const cursorInit = line({
  type: "system",
  subtype: "init",
  apiKeySource: "login",
  model: "Auto",
});

export function cursorText(options: { text: string; isPart: boolean }): string {
  return line({
    type: "assistant",
    message: {
      role: "assistant",
      content: [{ type: "text", text: options.text }],
    },
    ...(options.isPart ? { timestamp_ms: 1700000000100 } : {}),
  });
}

export function cursorSetScript(options: {
  callId: string;
  subtype: "started" | "completed";
}): string {
  return line({
    type: "tool_call",
    subtype: options.subtype,
    call_id: options.callId,
    tool_call: {
      mcpToolCall: {
        args: {
          providerIdentifier: "yumekit",
          toolName: "set_script",
          args: { script: "ready" },
        },
        ...(options.subtype === "completed"
          ? { result: { success: { content: [], isError: false } } }
          : {}),
      },
    },
  });
}

export const cursorResult = line({
  type: "result",
  subtype: "success",
  is_error: false,
  result: "The script now says ready.",
});
