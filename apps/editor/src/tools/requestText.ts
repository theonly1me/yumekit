import type { ClientFailure } from "../engine/engineClient.js";
import type { mediaServerRequests } from "./mediaServers.js";

export type KeyRequests = ReturnType<typeof mediaServerRequests>;

const failureTexts = {
  "token-rejected": "The engine did not accept this link.",
  "engine-unreachable": "The engine is not reachable.",
} as const;

export function failureTextOf(failure: ClientFailure): string {
  return failure.kind === "request-failed"
    ? failure.message
    : failureTexts[failure.kind];
}
