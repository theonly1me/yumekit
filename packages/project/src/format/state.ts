import type { Asset, WordTimings } from "./asset.js";
import type { Bible } from "./bible.js";
import type { Project } from "./project.js";
import type { Scene } from "./scene.js";
import type { Timeline } from "./timeline.js";

export interface ProjectSnapshot {
  revision: number;
  project: Project;
  script: string;
  bible: Bible;
  scenes: Scene[];
  sceneCode: Record<string, string>;
  sharedCode: Record<string, string>;
  timelines: Timeline[];
  assets: Asset[];
}

export type ProjectState = Omit<ProjectSnapshot, "revision"> & {
  words: Record<string, WordTimings>;
};
