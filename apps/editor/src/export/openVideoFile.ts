import type { EngineClient } from "../engine/engineClient.js";

export const largestOpenBytes = 512 * 1024 * 1024;

export type OpenOutcome =
  | { kind: "opened" }
  | { kind: "blocked"; url: string }
  | { kind: "too-large" }
  | { kind: "failed"; message: string };

const openedUrls = new Map<string, string>();

function keptUrlOf(options: { fileName: string; blob: Blob }): string {
  const before = openedUrls.get(options.fileName);
  if (before !== undefined) URL.revokeObjectURL(before);
  const url = URL.createObjectURL(options.blob);
  openedUrls.set(options.fileName, url);
  return url;
}

export async function openVideoFile(options: {
  client: EngineClient;
  fileName: string;
}): Promise<OpenOutcome> {
  const tab = window.open("", "_blank");
  const sent = await options.client.renderFile(options.fileName);
  if (!sent.ok) {
    tab?.close();
    return {
      kind: "failed",
      message:
        sent.failure.kind === "request-failed"
          ? sent.failure.message
          : "The engine is not reachable. Check that yumekit open still runs.",
    };
  }
  const size = Number(sent.value.headers.get("content-length") ?? "0");
  if (size > largestOpenBytes) {
    await sent.value.body?.cancel();
    tab?.close();
    return { kind: "too-large" };
  }
  const url = keptUrlOf({
    fileName: options.fileName,
    blob: await sent.value.blob(),
  });
  if (tab === null) return { kind: "blocked", url };
  tab.location.href = url;
  return { kind: "opened" };
}
