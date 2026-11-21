import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { JsonObject } from "@yumekit/tools";
import { z } from "zod";
import {
  harnessFailureResult,
  harnessResultOf,
  jsonObjectOf,
  type HarnessResult,
} from "./harnessResult.js";
import { harnessToolsOf, type HarnessOptions } from "./harnessTools.js";
import { mcpInputFailureOf } from "./mcpInputFailure.js";
import type { HarnessTool, ProgressListener } from "./toolTable.js";

export interface HarnessToolListing {
  name: string;
  description: string;
  inputSchema: JsonObject;
  annotations?: ToolAnnotations;
}

export interface HarnessCall {
  name: string;
  input: JsonObject;
  onProgress?: ProgressListener;
}

export interface Harness {
  tools: HarnessToolListing[];
  call: (request: HarnessCall) => Promise<HarnessResult>;
  close: () => Promise<void>;
}

const emptyInputSchema: JsonObject = { type: "object", properties: {} };

function inputSchemaOf(tool: HarnessTool): JsonObject {
  if (Object.keys(tool.inputShape).length === 0) return emptyInputSchema;
  return jsonObjectOf(
    z.toJSONSchema(z.object(tool.inputShape), {
      target: "draft-7",
      io: "input",
    }),
  );
}

function toolNotFound(name: string): HarnessResult {
  return harnessFailureResult({
    kind: "tool-not-found",
    message: `The harness has no tool "${name}".`,
    hint: "Use a name from the tool list of the harness.",
  });
}

const harnessClosed = harnessFailureResult({
  kind: "harness-closed",
  message: "The harness is closed.",
  hint: "Create the harness again with createHarness.",
});

async function runTool(options: {
  tool: HarnessTool;
  input: JsonObject;
  onProgress: ProgressListener | undefined;
}): Promise<HarnessResult> {
  const { tool, input, onProgress } = options;
  const mcpInputFailure = await mcpInputFailureOf({ tool, input });
  const result = harnessResultOf(
    await tool.run({
      input,
      ...(onProgress === undefined ? {} : { onProgress }),
    }),
  );
  return mcpInputFailure === undefined
    ? result
    : { ...result, mcpResult: mcpInputFailure };
}

export function createHarness(options: HarnessOptions): Harness {
  const harnessTools = harnessToolsOf(options);
  const toolsByName = new Map(harnessTools.map((tool) => [tool.name, tool]));
  const running = new Set<Promise<HarnessResult>>();
  let isClosed = false;
  return {
    tools: harnessTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: inputSchemaOf(tool),
      ...(tool.annotations === undefined
        ? {}
        : { annotations: tool.annotations }),
    })),
    call: async ({ name, input, onProgress }) => {
      if (isClosed) return harnessClosed;
      const tool = toolsByName.get(name);
      if (tool === undefined) return toolNotFound(name);
      const pending = runTool({ tool, input, onProgress });
      running.add(pending);
      try {
        return await pending;
      } finally {
        running.delete(pending);
      }
    },
    close: async () => {
      isClosed = true;
      await Promise.allSettled([...running]);
      await options.mediaTools.close();
    },
  };
}
