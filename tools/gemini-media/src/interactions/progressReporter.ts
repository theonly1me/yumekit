import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function progressReporter(
  extra: ToolExtra,
): (poll: number) => Promise<void> {
  const progressToken = extra._meta?.progressToken;
  return async (poll) => {
    if (progressToken === undefined) return;
    await extra.sendNotification({
      method: "notifications/progress",
      params: {
        progressToken,
        progress: poll,
        message: `Waiting for the Gemini API, check ${String(poll)}`,
      },
    });
  };
}
