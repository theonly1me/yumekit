import type { StagePageData } from "./stagePageData.js";

export const previewPagePath = "/preview.html";
export const previewDataPath = "/preview-data";
export const previewEventsPath = "/preview-events";

export type PreviewData =
  | {
      ok: true;
      pageData: StagePageData;
      moduleSceneUrls: Record<string, string>;
      frameCount: number;
    }
  | { ok: false; kind: string; message: string };

export function isPreviewData(value: unknown): value is PreviewData {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    return false;
  }
  return value.ok === true
    ? "pageData" in value &&
        "moduleSceneUrls" in value &&
        "frameCount" in value &&
        typeof value.frameCount === "number"
    : "kind" in value &&
        typeof value.kind === "string" &&
        "message" in value &&
        typeof value.message === "string";
}
