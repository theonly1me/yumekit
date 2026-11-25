import { AsyncLocalStorage } from "node:async_hooks";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { MadeBy } from "@yumekit/project";
import { createPictureRenderer } from "@yumekit/render";
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
import { createWorkBoard, type WorkItem } from "../work/board/workBoard.js";
import { createFilmClock, type ClockRecord } from "../clock/filmClock.js";
import {
  sendTake,
  type SendTakeFailure,
  type SentTake,
  type TakeNoteInput,
} from "../takes/sendTake.js";
import type { Outcome } from "../results.js";

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
  by?: MadeBy;
  reviewJobId?: string;
}

export interface HarnessWork {
  items: () => WorkItem[];
  subscribe: (listener: (items: WorkItem[]) => void) => () => void;
}

export interface Harness {
  tools: HarnessToolListing[];
  work: HarnessWork;
  clock: () => Promise<ClockRecord>;
  call: (request: HarnessCall) => Promise<HarnessResult>;
  sendTake: (request: {
    takeId: string;
    notes: TakeNoteInput[];
  }) => Promise<Outcome<SentTake, SendTakeFailure>>;
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
  reviewJobId: string | undefined;
}): Promise<HarnessResult> {
  const { tool, input, onProgress, reviewJobId } = options;
  const mcpInputFailure = await mcpInputFailureOf({ tool, input });
  const result = harnessResultOf(
    await tool.run({
      input,
      ...(onProgress === undefined ? {} : { onProgress }),
      ...(reviewJobId === undefined ? {} : { reviewJobId }),
    }),
  );
  return mcpInputFailure === undefined
    ? result
    : { ...result, mcpResult: mcpInputFailure };
}

export function createHarness(options: HarnessOptions): Harness {
  const pictures = createPictureRenderer({ folder: options.store.folder });
  const callers = new AsyncLocalStorage<{ by: MadeBy | undefined }>();
  const board = createWorkBoard();
  const clock = createFilmClock(options.store.folder);
  const harnessTools = harnessToolsOf({
    ...options,
    pictures,
    board,
    clock,
    callerOf: () => callers.getStore()?.by,
  });
  const toolsByName = new Map(harnessTools.map((tool) => [tool.name, tool]));
  const running = new Set<Promise<HarnessResult>>();
  let isClosed = false;
  return {
    work: { items: board.items, subscribe: board.subscribe },
    clock: clock.read,
    tools: harnessTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: inputSchemaOf(tool),
      ...(tool.annotations === undefined
        ? {}
        : { annotations: tool.annotations }),
    })),
    call: async ({ name, input, onProgress, by, reviewJobId }) => {
      if (isClosed) return harnessClosed;
      const tool = toolsByName.get(name);
      if (tool === undefined) return toolNotFound(name);
      const pending = callers.run({ by }, () =>
        runTool({ tool, input, onProgress, reviewJobId }),
      );
      running.add(pending);
      try {
        return await pending;
      } finally {
        running.delete(pending);
      }
    },
    sendTake: (request) => sendTake({ store: options.store, ...request }),
    close: async () => {
      isClosed = true;
      await Promise.allSettled([...running]);
      await pictures.close();
      await options.mediaTools.close();
    },
  };
}
