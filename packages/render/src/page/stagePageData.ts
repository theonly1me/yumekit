import type { StageProject } from "@yumekit/stage";

export type PageSceneSource =
  { kind: "kit"; component: string } | { kind: "module"; file: string };

export interface StagePageData {
  project: StageProject;
  sceneSources: Record<string, PageSceneSource>;
}

export type SeekResult =
  { ok: true } | { ok: false; sceneId: string; message: string };

export interface StagePageApi {
  seek: (frame: number) => Promise<SeekResult>;
}

declare global {
  interface Window {
    yumekitStage?: StagePageApi;
  }
}
