import type { MediaToolFailure } from "@yumekit/tools";
import type { HarnessFailure } from "../results.js";

function failureMessage(failure: MediaToolFailure): string {
  switch (failure.kind) {
    case "no-server-for-capability":
      return failure.server === undefined
        ? `No connected media server has the capability ${failure.capability}.`
        : `The media server "${failure.server}" has no ${failure.capability} tool.`;
    case "server-not-found":
      return `No media server is named "${failure.server}".`;
    case "server-failed-to-start":
      return `The media server "${failure.server}" did not start: ${failure.message}`;
    case "media-tool-failed":
      return `The media server "${failure.server}" failed: ${failure.message}`;
    case "media-tool-invalid-result":
      return `The media server "${failure.server}" returned a result that does not follow the media tool convention: ${failure.message}`;
    case "media-tool-timeout":
      return `The media server "${failure.server}" did not answer within ${String(failure.timeoutSeconds)} seconds.`;
  }
}

function failureHint(failure: MediaToolFailure): string {
  switch (failure.kind) {
    case "no-server-for-capability":
    case "server-not-found":
      return "Call list_media_tools and use a server that lists this capability. If none does, ask the user to connect one in media-tools.json.";
    case "server-failed-to-start":
      return "Use another server from list_media_tools, or ask the user to fix the server. The message gives the reason.";
    case "media-tool-failed":
      return "Read the message of the server. If the input is wrong, correct it and call again. If it names a missing key or setting, ask the user to set it.";
    case "media-tool-invalid-result":
      return "This server does not work with the harness. Use another server from list_media_tools, and tell the user.";
    case "media-tool-timeout":
      return "Call again with a shorter input, or use another server from list_media_tools.";
  }
}

export function mediaFailureOf(failure: MediaToolFailure): HarnessFailure {
  return {
    kind: failure.kind,
    message: failureMessage(failure),
    hint: failureHint(failure),
  };
}
