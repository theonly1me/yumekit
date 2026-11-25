import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { TempoGrid } from "@yumekit/project";
import { framesOfBeats } from "../beats/framesOfBeats.js";
import { withBeatTwins } from "../beats/twinShape.js";
import { failureResult } from "../results.js";

export interface HarnessProgress {
  done: number;
  total?: number;
  message?: string;
}

export type ProgressListener = (progress: HarnessProgress) => void;

export interface ToolRequest<Input> {
  input: Input;
  onProgress?: ProgressListener;
  reviewJobId?: string;
}

export interface ToolDefinition<Shape extends z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: Shape;
  annotations?: ToolAnnotations;
  run: (
    request: ToolRequest<z.output<z.ZodObject<Shape>>>,
  ) => CallToolResult | Promise<CallToolResult>;
}

export interface HarnessTool {
  name: string;
  description: string;
  inputShape: z.ZodRawShape;
  annotations?: ToolAnnotations;
  run: (request: ToolRequest<unknown>) => Promise<CallToolResult>;
}

export interface ToolTable {
  add: <Shape extends z.ZodRawShape>(definition: ToolDefinition<Shape>) => void;
  tools: () => HarnessTool[];
}

function invalidInput(options: { name: string; error: z.ZodError }) {
  return failureResult({
    kind: "invalid-input",
    message: `Invalid arguments for tool ${options.name}: ${z.prettifyError(options.error)}`,
    hint: "Correct each field that the message names, then call the tool again.",
  });
}

function harnessToolOf<Shape extends z.ZodRawShape>(options: {
  definition: ToolDefinition<Shape>;
  tempoGrid: () => TempoGrid | undefined;
}): HarnessTool {
  const { definition } = options;
  const schema = z.object(definition.inputSchema);
  const inputShape = withBeatTwins(definition.inputSchema);
  const twinSchema = z.object(inputShape);
  return {
    name: definition.name,
    description: definition.description,
    inputShape,
    ...(definition.annotations === undefined
      ? {}
      : { annotations: definition.annotations }),
    run: async ({ input, onProgress, reviewJobId }) => {
      const checked = await twinSchema.safeParseAsync(input);
      if (!checked.success) {
        return invalidInput({ name: definition.name, error: checked.error });
      }
      const converted = framesOfBeats({ input, grid: options.tempoGrid() });
      if (!converted.ok) return failureResult(converted.failure);
      const parsed = await schema.safeParseAsync(converted.value);
      if (!parsed.success) {
        return invalidInput({ name: definition.name, error: parsed.error });
      }
      return definition.run({
        input: parsed.data,
        ...(onProgress === undefined ? {} : { onProgress }),
        ...(reviewJobId === undefined ? {} : { reviewJobId }),
      });
    },
  };
}

export function createToolTable(options: {
  tempoGrid: () => TempoGrid | undefined;
}): ToolTable {
  const tools: HarnessTool[] = [];
  return {
    add: (definition) => {
      tools.push(harnessToolOf({ definition, tempoGrid: options.tempoGrid }));
    },
    tools: () => [...tools],
  };
}
