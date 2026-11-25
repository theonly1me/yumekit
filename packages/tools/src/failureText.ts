import type { SpendingLimitReached } from "./spending/spendingBook.js";
import type { MediaToolFailure } from "./types.js";

function dollars(usd: number): string {
  return `${usd.toFixed(usd < 0.1 && usd > 0 ? 4 : 2)} US dollars`;
}

function spendingLimitText(failure: SpendingLimitReached): string {
  const priceText =
    failure.priceBasis === "cautious"
      ? `This call has no known price, so yumekit counts a cautious ${dollars(failure.priceUsd)}`
      : `This call costs about ${dollars(failure.priceUsd)}`;
  return `${priceText}. The project has spent ${dollars(failure.spentUsd)} of its limit of ${dollars(failure.limitUsd)}, so the call would pass the limit. yumekit did not make it.`;
}

export function mediaFailureText(failure: MediaToolFailure): string {
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
    case "media-key-not-working":
      return `The key of the media server "${failure.server}" does not work: ${failure.message}`;
    case "media-service-not-ready":
      return `The media server "${failure.server}" is not ready: ${failure.message}`;
    case "media-usage-limit-reached":
      return `The media server "${failure.server}" reached the usage limit of the plan of the person: ${failure.message}`;
    case "service-quota":
      return `The quota of the service "${failure.server}" for this model is used up: ${failure.message}`;
    case "spending-limit-reached":
      return spendingLimitText(failure);
    case "spending-record-not-valid":
      return `The spending record ${failure.file} is not valid, so yumekit makes no paid call: ${failure.message}`;
  }
}
