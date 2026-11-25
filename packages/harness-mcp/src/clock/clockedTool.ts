import type { ProjectSnapshot } from "@yumekit/project";
import type { HarnessTool } from "../harness/toolTable.js";
import type { FilmClock } from "./filmClock.js";
import { stageOfCall } from "./filmStages.js";

export function clockedTool(options: {
  tool: HarnessTool;
  clock: FilmClock;
  read: () => ProjectSnapshot;
  isPerson: () => boolean;
}): HarnessTool {
  const { tool, clock } = options;
  return {
    ...tool,
    run: async (request) => {
      const stage = options.isPerson()
        ? undefined
        : stageOfCall({
            name: tool.name,
            input: request.input,
            snapshot: options.read(),
          });
      if (stage === undefined) return tool.run(request);
      await clock.mark({ stage, at: new Date() });
      const result = await tool.run(request);
      await clock.mark({ stage, at: new Date() });
      return result;
    },
  };
}
