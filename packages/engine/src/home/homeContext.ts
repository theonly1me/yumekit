import type { AgentPrograms } from "../chat/agentChoice.js";
import type { ProjectEngines } from "./projectEngines.js";
import type { StartFiles } from "./startFiles/stageUpload.js";

export interface HomeContext {
  version: string;
  programs: AgentPrograms;
  engines: ProjectEngines;
  creating: { queue: Promise<unknown> };
  startFiles: StartFiles;
}
