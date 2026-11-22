import { z } from "zod";

const initSchema = z.looseObject({
  type: z.literal("system"),
  subtype: z.literal("init"),
  session_id: z.string().min(1),
});

export const textBlockSchema = z.looseObject({
  type: z.literal("text"),
  text: z.string(),
});

const assistantSchema = z.looseObject({
  type: z.literal("assistant"),
  message: z.looseObject({ content: z.array(z.unknown()) }),
  model_call_id: z.string().optional(),
  timestamp_ms: z.number().optional(),
});

export const mcpToolCallSchema = z.looseObject({
  mcpToolCall: z.looseObject({
    args: z.looseObject({
      providerIdentifier: z.string(),
      toolName: z.string(),
      args: z.unknown(),
    }),
    result: z
      .looseObject({
        success: z.looseObject({ isError: z.boolean() }).optional(),
      })
      .optional(),
  }),
});

const toolCallSchema = z.looseObject({
  type: z.literal("tool_call"),
  subtype: z.enum(["started", "completed"]),
  call_id: z.string(),
  tool_call: z.unknown(),
});

const resultSchema = z.looseObject({
  type: z.literal("result"),
  is_error: z.boolean(),
  result: z.string().optional(),
});

export const cursorLineSchema = z.union([
  initSchema,
  assistantSchema,
  toolCallSchema,
  resultSchema,
]);

export type CursorLine = z.infer<typeof cursorLineSchema>;
