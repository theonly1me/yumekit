import { replaceProperty } from "./replaceProperty.js";

const networkBlockedMessage =
  "A scene must not make a network request in render mode. Use an asset from findAsset.";

function blockedConnection(): never {
  throw new Error(networkBlockedMessage);
}

export function blockNetwork(): () => void {
  const restoreSteps = [
    replaceProperty({
      target: globalThis,
      key: "fetch",
      value: () => Promise.reject(new Error(networkBlockedMessage)),
    }),
    ...["XMLHttpRequest", "WebSocket", "EventSource"].map((key) =>
      replaceProperty({ target: globalThis, key, value: blockedConnection }),
    ),
    replaceProperty({
      target: navigator,
      key: "sendBeacon",
      value: () => false,
    }),
  ];
  return () => {
    for (const restore of restoreSteps.toReversed()) {
      restore();
    }
  };
}
