import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { OnDownloadProgress } from "../naturalVoice/naturalVoice.ts";

export function progressReporterOf(options: {
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>;
  line: string;
}): OnDownloadProgress {
  const { extra } = options;
  return async (progress) => {
    const progressToken = extra._meta?.progressToken;
    if (progressToken === undefined) return;
    await extra.sendNotification({
      method: "notifications/progress",
      params: {
        progressToken,
        progress: progress.done,
        total: progress.total,
        message: options.line,
      },
    });
  };
}
