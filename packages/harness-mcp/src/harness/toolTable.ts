import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
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

function harnessToolOf<Shape extends z.ZodRawShape>(
  definition: ToolDefinition<Shape>,
): HarnessTool {
  const schema = z.object(definition.inputSchema);
  return {
    name: definition.name,
    description: definition.description,
    inputShape: definition.inputSchema,
    ...(definition.annotations === undefined
      ? {}
      : { annotations: definition.annotations }),
    run: async ({ input, onProgress }) => {
      const parsed = await schema.safeParseAsync(input);
      if (!parsed.success) {
        return failureResult({
          kind: "invalid-input",
          message: `Invalid arguments for tool ${definition.name}: ${z.prettifyError(parsed.error)}`,
          hint: "Correct each field that the message names, then call the tool again.",
        });
      }
      return definition.run({
        input: parsed.data,
        ...(onProgress === undefined ? {} : { onProgress }),
      });
    },
  };
}

export function createToolTable(): ToolTable {
  const tools: HarnessTool[] = [];
  return {
    add: (definition) => {
      tools.push(harnessToolOf(definition));
    },
    tools: () => [...tools],
  };
}
