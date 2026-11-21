import { getParseErrorMessage } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import {
  ErrorCode,
  McpError,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { HarnessTool } from "./toolTable.js";

export async function mcpInputFailureOf(options: {
  tool: HarnessTool;
  input: unknown;
}): Promise<CallToolResult | undefined> {
  const { tool } = options;
  if (Object.keys(tool.inputShape).length === 0) return undefined;
  const parsed = await z.object(tool.inputShape).safeParseAsync(options.input);
  if (parsed.success) return undefined;
  const error = new McpError(
    ErrorCode.InvalidParams,
    `Input validation error: Invalid arguments for tool ${tool.name}: ${getParseErrorMessage(parsed.error)}`,
  );
  return { isError: true, content: [{ type: "text", text: error.message }] };
}
