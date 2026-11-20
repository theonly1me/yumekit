import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { successResult } from "../toolResults.ts";
import { catalog } from "./catalog.ts";

export function registerDescribeTool(server: McpServer): void {
  server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: its models, their settings and prices, and the key it needs. Free, and makes no network request.",
    },
    () => successResult(catalog),
  );
}
