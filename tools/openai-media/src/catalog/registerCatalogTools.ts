import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { openAiApiUrl, type SendRequest } from "../openAiApi.ts";
import { errorMessage } from "../toolResults.ts";
import { openAiDescription, type ActiveModels } from "./catalog.ts";

const readOnly = { readOnlyHint: true } as const;

function keyCheckResult(check: {
  valid: boolean;
  message: string;
}): CallToolResult {
  return {
    content: [{ type: "text", text: check.message }],
    structuredContent: { ...check },
  };
}

async function checkKey(options: {
  apiKey: string | undefined;
  sendRequest: SendRequest;
}): Promise<CallToolResult> {
  if (!options.apiKey) {
    return keyCheckResult({
      valid: false,
      message: "OPENAI_API_KEY is not set.",
    });
  }
  let response: Response;
  try {
    response = await options.sendRequest(
      new Request(`${openAiApiUrl}/models`, {
        method: "GET",
        headers: { authorization: `Bearer ${options.apiKey}` },
      }),
    );
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Cannot reach the OpenAI API: ${errorMessage(error)}`,
        },
      ],
    };
  }
  await response.body?.cancel();
  if (response.ok) {
    return keyCheckResult({
      valid: true,
      message: "The OpenAI API accepted the key.",
    });
  }
  if (response.status === 401 || response.status === 403) {
    return keyCheckResult({
      valid: false,
      message: `The OpenAI API rejected the key (status ${String(response.status)}). Make a new key at https://platform.openai.com/api-keys.`,
    });
  }
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `The OpenAI API answered ${String(response.status)} to the key check.`,
      },
    ],
  };
}

export function registerCatalogTools(options: {
  server: McpServer;
  activeModels: ActiveModels;
  apiKey: string | undefined;
  sendRequest: SendRequest;
}): void {
  const description = openAiDescription(options.activeModels);
  options.server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: its label, where it runs, its key, and its models with their settings and prices. Makes no request.",
      annotations: readOnly,
    },
    () => ({
      content: [{ type: "text", text: JSON.stringify(description) }],
      structuredContent: { ...description },
    }),
  );
  options.server.registerTool(
    "check_key",
    {
      description:
        "Check OPENAI_API_KEY with one free request that lists the models. Returns valid and a message.",
      annotations: readOnly,
    },
    () => checkKey(options),
  );
}
