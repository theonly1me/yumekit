import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { StructuredData } from "../results.js";
import { promptFieldsOf, promptLineOf } from "./promptParts.js";

export interface CallFacts {
  lines: string[];
  data: StructuredData;
}

export function callFactsOf(options: {
  prompt: string | undefined;
  lessons: CallFacts | undefined;
}): CallFacts {
  const { prompt } = options;
  return {
    lines: [
      ...(prompt === undefined ? [] : [promptLineOf(prompt)]),
      ...(options.lessons?.lines ?? []),
    ],
    data: {
      ...(prompt === undefined ? {} : promptFieldsOf(prompt)),
      ...options.lessons?.data,
    },
  };
}

function firstTextOf(result: CallToolResult): string {
  const [first] = result.content;
  return first?.type === "text" ? first.text : "";
}

export function withCallFacts(options: {
  result: CallToolResult;
  facts: CallFacts;
}): CallToolResult {
  const { result, facts } = options;
  if (facts.lines.length === 0 && Object.keys(facts.data).length === 0) {
    return result;
  }
  const data = { ...result.structuredContent, ...facts.data };
  const text = [firstTextOf(result), ...facts.lines].join("\n");
  return {
    ...result,
    content: [
      { type: "text", text },
      ...(result.isError === true
        ? []
        : [{ type: "text" as const, text: JSON.stringify(data) }]),
    ],
    structuredContent: data,
  };
}
