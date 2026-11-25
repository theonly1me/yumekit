import { mediaFailureText, type MediaToolFailure } from "@yumekit/tools";
import type { HarnessFailure } from "../results.js";

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
    case "media-key-not-working":
      return "Tell the person in one sentence that the key does not work, with the message, and that they can add a new key in Settings. Use another ready server from list_media_tools for now.";
    case "media-service-not-ready":
      return "Tell the person in one sentence why the service is not ready, with the step in the message. Use another ready server from list_media_tools for now.";
    case "media-usage-limit-reached":
      return "Tell the person that the plan reached its usage limit. Make no more calls to this server until the limit resets. Use another ready server from list_media_tools only when the person permits paid calls, or make the rest with free tools.";
    case "service-quota":
      return "Make no more calls to this service with this model for now. Tell the person in one sentence that the quota of the service for this model is used up, and that they can wait for it to reset or pick another service in Settings. Make the rest with another ready service, or with free tools.";
    case "spending-limit-reached":
      return "Make no more paid calls. Tell the person the limit, the amount spent, and the price, and that only they can raise the spending limit in Settings. Make the rest with free tools: graphics drawn by code, the music and the voice of this computer.";
    case "spending-record-not-valid":
      return "Tell the person that the spending record of the project is damaged. Use only free tools until they fix or remove the file.";
  }
}

export type MediaHarnessFailure = HarnessFailure & {
  reason?: string;
  limit_usd?: number;
  spent_usd?: number;
  price_usd?: number;
  price_is_cautious?: boolean;
  server?: string;
  variable?: string;
  get_key_url?: string;
  steps?: string[];
};

export function mediaFailureOf(failure: MediaToolFailure): MediaHarnessFailure {
  const base = {
    kind: failure.kind,
    message: mediaFailureText(failure),
    hint: failureHint(failure),
  };
  if (failure.kind === "media-tool-failed") {
    return { ...base, reason: failure.message };
  }
  if (failure.kind === "spending-limit-reached") {
    return {
      ...base,
      server: failure.server,
      limit_usd: failure.limitUsd,
      spent_usd: failure.spentUsd,
      price_usd: failure.priceUsd,
      price_is_cautious: failure.priceBasis === "cautious",
    };
  }
  if (
    failure.kind === "media-service-not-ready" ||
    failure.kind === "media-usage-limit-reached" ||
    failure.kind === "service-quota"
  ) {
    return { ...base, reason: failure.message, server: failure.server };
  }
  if (failure.kind === "media-key-not-working") {
    return {
      ...base,
      reason: failure.message,
      server: failure.server,
      get_key_url: failure.getKeyUrl,
      steps: failure.steps,
    };
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
