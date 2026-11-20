import type { SceneClip } from "@yumekit/project";
import type {
  JsonObject,
  SceneAsset,
  SceneModule,
  SceneOutput,
} from "@yumekit/scene";

export interface StageProject {
  framesPerSecond: number;
  output: SceneOutput;
  scenes: { id: string; props: JsonObject }[];
  sceneTracks: SceneClip[][];
  assets: Record<string, SceneAsset>;
}

export interface StageOptions {
  element: HTMLElement;
  project: StageProject;
  loadScene: (sceneId: string) => Promise<SceneModule>;
  mode: "render" | "preview";
}

export interface Stage {
  seek: (frame: number) => Promise<void>;
  dispose: () => void;
}
