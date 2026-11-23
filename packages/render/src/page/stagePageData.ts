import type { LookId } from "@yumekit/scene-kit";
import type { StageProject } from "@yumekit/stage";

export type PageSceneSource =
  { kind: "kit"; component: string } | { kind: "module"; file: string };

export interface StagePageData {
  look: LookId;
  calm: boolean;
  project: StageProject;
  sceneSources: Record<string, PageSceneSource>;
}

export interface StagePageLoad {
  pageData: StagePageData;
  moduleSceneUrls: Record<string, string>;
}

export function isStagePageLoad(value: unknown): value is StagePageLoad {
  return (
    typeof value === "object" &&
    value !== null &&
    "pageData" in value &&
    typeof value.pageData === "object" &&
    "moduleSceneUrls" in value &&
    typeof value.moduleSceneUrls === "object"
  );
}

export type SeekResult =
  | { ok: true }
  | { ok: false; kind: "scene-error"; sceneId: string; message: string }
  | {
      ok: false;
      kind: "kit-scene-not-found";
      sceneId: string;
      component: string;
      message: string;
    };

export interface StagePageApi {
  load: (pageLoadText: string) => Promise<void>;
  seek: (frame: number) => Promise<SeekResult>;
}

declare global {
  interface Window {
    yumekitStage?: StagePageApi;
    yumekitImport?: (url: string) => Promise<unknown>;
  }
}
