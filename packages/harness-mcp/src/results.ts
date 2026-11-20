import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface HarnessFailure {
  kind: string;
  message: string;
  hint: string;
}

export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

export type StructuredData = Record<string, unknown>;

export function successResult(options: {
  line: string;
  data: StructuredData;
}): CallToolResult {
  return {
    content: [
      { type: "text", text: options.line },
      { type: "text", text: JSON.stringify(options.data) },
    ],
    structuredContent: options.data,
  };
}

export function failureResult(failure: HarnessFailure): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `${failure.kind}: ${failure.message}\nHint: ${failure.hint}`,
      },
    ],
    structuredContent: { ...failure },
  };
}
