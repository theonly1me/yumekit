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
  seek: (frame: number) => Promise<SeekResult>;
}

declare global {
  interface Window {
    yumekitStage?: StagePageApi;
  }
}
