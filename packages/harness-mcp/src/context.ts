import type { ProjectStore } from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import type { ToolTable } from "./harness/toolTable.js";

export interface HarnessContext {
  tools: ToolTable;
  store: ProjectStore;
  mediaTools: MediaTools;
}
