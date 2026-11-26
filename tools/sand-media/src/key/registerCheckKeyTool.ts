import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  keyVariable,
  missingKeyMessage,
  sandRequest,
  sandUrls,
  sendToSand,
  withoutKey,
  type SendRequest,
} from "../sandApi.ts";
import { errorResult, successResult } from "../toolResults.ts";

const rejectedKeyStatuses = [401, 403];
const generationThatIsNotThere = "1";

export function registerCheckKeyTool(options: {
  server: McpServer;
  apiKey: string | undefined;
  sendRequest: SendRequest;
}): void {
  options.server.registerTool(
    "check_key",
    {
      description: `Check ${keyVariable} with one free request that reads a generation that is not there. It makes no clip and costs nothing.`,
    },
    async () => {
      const { apiKey } = options;
      if (!apiKey) {
        return successResult({ valid: false, message: missingKeyMessage });
      }
      const sent = await sendToSand({
        sendRequest: options.sendRequest,
        request: sandRequest({
          url: `${sandUrls.generations}/${generationThatIsNotThere}`,
          apiKey,
        }),
      });
      const valid = {
        valid: true,
        message: `Sand AI accepted the key in ${keyVariable}.`,
      };
      if (sent.ok) return successResult(valid);
      const { failure } = sent;
      if (failure.status === 404 && failure.code === "generation_not_found") {
        return successResult(valid);
      }
      const message = withoutKey({ message: failure.message, apiKey });
      if (
        failure.status !== undefined &&
        rejectedKeyStatuses.includes(failure.status)
      ) {
        return successResult({
          valid: false,
          message: `Sand AI rejected the key in ${keyVariable}. Create a new key at ${sandUrls.keys} and save it again. ${message}`,
        });
      }
      return errorResult({
        message: `Cannot check ${keyVariable}. ${message}`,
      });
    },
  );
}
