export const codexMadeUpThreadId = "01aaaaaa-made-up-thread";

function line(value: object): string {
  return JSON.stringify(value);
}

function toolCall(options: { status: string; error: object | null }): object {
  return {
    id: "item_1",
    type: "mcp_tool_call",
    server: "yumekit",
    tool: "set_script",
    arguments: { text: "ready" },
    result: null,
    error: options.error,
    status: options.status,
  };
}

export const codexStart = [
  line({ type: "thread.started", thread_id: codexMadeUpThreadId }),
  line({ type: "turn.started" }),
];

export function codexToolStream(options: {
  status: string;
  error: object | null;
}): string[] {
  return [
    ...codexStart,
    line({
      type: "item.completed",
      item: { id: "item_0", type: "agent_message", text: "I will set it." },
    }),
    line({
      type: "item.started",
      item: toolCall({ status: "in_progress", error: null }),
    }),
    line({ type: "error", message: "Reconnecting... 1/5" }),
    line({ type: "item.completed", item: toolCall(options) }),
    line({
      type: "item.completed",
      item: { id: "item_2", type: "agent_message", text: "It says ready." },
    }),
    line({ type: "turn.completed", usage: { input_tokens: 10 } }),
  ];
}

export const codexNestedFailureStream = [
  ...codexStart,
  line({
    type: "turn.failed",
    error: {
      message: JSON.stringify({
        type: "error",
        status: 400,
        error: { type: "invalid_request_error", message: "The model is gone." },
      }),
    },
  }),
];

export const codexFailedStream = [
  ...codexStart,
  line({ type: "turn.failed", error: { message: "The model is busy." } }),
];
