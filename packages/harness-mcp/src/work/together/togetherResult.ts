import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface TogetherPart {
  id: string;
  result: CallToolResult;
}

function textOf(result: CallToolResult): string {
  const [first] = result.content;
  return first?.type === "text" ? first.text : "";
}

export function togetherResult(options: {
  results: TogetherPart[];
  what: string;
}): CallToolResult {
  const { results } = options;
  const failedCount = results.filter(
    (part) => part.result.isError === true,
  ).length;
  const parts = results.map((part) => ({
    id: part.id,
    ok: part.result.isError !== true,
    ...part.result.structuredContent,
  }));
  const lines = results.map((part) => `- ${part.id}: ${textOf(part.result)}`);
  const head = `${String(results.length - failedCount)} of ${String(results.length)} ${options.what} worked.`;
  const data = {
    worked: results.length - failedCount,
    failed: failedCount,
    results: parts,
  };
  return {
    ...(failedCount === results.length ? { isError: true } : {}),
    content: [
      { type: "text", text: [head, ...lines].join("\n") },
      { type: "text", text: JSON.stringify(data) },
    ],
    structuredContent: data,
  };
}
