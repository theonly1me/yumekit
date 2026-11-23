import type { ProjectStore } from "@yumekit/project";
import type { PictureRenderer } from "@yumekit/render";
import type { MediaTools } from "@yumekit/tools";
import type { ToolTable } from "./harness/toolTable.js";

export interface HarnessContext {
  tools: ToolTable;
  store: ProjectStore;
  mediaTools: MediaTools;
  pictures: PictureRenderer;
}
