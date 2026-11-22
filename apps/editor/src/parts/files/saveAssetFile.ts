import type { EngineClient } from "../../engine/engineClient.js";
import { failureTextOf } from "../../tools/requestText.js";

export type SaveOutcome =
  { kind: "saved" } | { kind: "failed"; message: string };

export function fileNameOfDisposition(options: {
  header: string | null;
  fallback: string;
}): string {
  const header = options.header ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (encoded !== undefined) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return options.fallback;
    }
  }
  return /filename="([^"]+)"/i.exec(header)?.[1] ?? options.fallback;
}

export async function saveAssetFile(options: {
  client: EngineClient;
  assetId: string;
}): Promise<SaveOutcome> {
  const sent = await options.client.assetDownload(options.assetId);
  if (!sent.ok) {
    return { kind: "failed", message: failureTextOf(sent.failure) };
  }
  const fileName = fileNameOfDisposition({
    header: sent.value.headers.get("content-disposition"),
    fallback: options.assetId,
  });
  const url = URL.createObjectURL(await sent.value.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
  return { kind: "saved" };
}
