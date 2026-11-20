import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  geminiApiUrl,
  geminiRequest,
  missingKeyMessage,
  sendToGemini,
  type SendRequest,
} from "../geminiApi.ts";
import { successResult } from "../toolResults.ts";

async function checkKey(options: {
  apiKey: string | undefined;
  model: string;
  sendRequest: SendRequest;
}): Promise<{ valid: boolean; message: string }> {
  if (!options.apiKey) return { valid: false, message: missingKeyMessage };
  const sent = await sendToGemini({
    sendRequest: options.sendRequest,
    request: geminiRequest({
      url: `${geminiApiUrl}/models/${encodeURIComponent(options.model)}`,
      apiKey: options.apiKey,
    }),
  });
  if (!sent.ok) {
    return {
      valid: false,
      message: `GEMINI_API_KEY does not work. ${sent.failure}`,
    };
  }
  return {
    valid: true,
    message: `GEMINI_API_KEY works, and the Gemini API knows the model ${options.model}.`,
  };
}

export function registerCheckKeyTool(options: {
  server: McpServer;
  apiKey: string | undefined;
  model: string;
  sendRequest: SendRequest;
}): void {
  options.server.registerTool(
    "check_key",
    {
      description:
        "Check GEMINI_API_KEY with one free request that reads the model facts. Returns valid and a message.",
    },
    async () => successResult(await checkKey(options)),
  );
}
