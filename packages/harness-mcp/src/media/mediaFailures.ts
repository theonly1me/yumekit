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
    case "media-key-missing":
      return `The media server "${failure.server}" needs the key ${failure.variable}, and it is not set. Add the key in the editor under Tools, or run \`yumekit keys set ${failure.variable}\`.`;
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
    case "media-key-missing":
      return "Tell the person to follow steps to get the key at get_key_url and to add it. Never ask for the value of the key in the chat. Or use another server from list_media_tools.";
  }
}

export type MediaHarnessFailure = HarnessFailure & {
  reason?: string;
  server?: string;
  variable?: string;
  get_key_url?: string;
  steps?: string[];
};

export function mediaFailureOf(failure: MediaToolFailure): MediaHarnessFailure {
  const base = {
    kind: failure.kind,
    message: failureMessage(failure),
    hint: failureHint(failure),
  };
  if (failure.kind === "media-tool-failed") {
    return { ...base, reason: failure.message };
  }
  if (failure.kind !== "media-key-missing") return base;
  return {
    ...base,
    server: failure.server,
    variable: failure.variable,
    get_key_url: failure.getKeyUrl,
    steps: failure.steps,
  };
}
