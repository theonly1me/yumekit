import { z } from "zod";

const initSchema = z.looseObject({
  type: z.literal("system"),
  subtype: z.literal("init"),
  session_id: z.string().min(1),
  mcp_servers: z
    .array(z.looseObject({ name: z.string(), status: z.string() }))
    .default([]),
});

const textDeltaSchema = z.looseObject({
  type: z.literal("stream_event"),
  event: z.looseObject({
    type: z.literal("content_block_delta"),
    delta: z.looseObject({ type: z.literal("text_delta"), text: z.string() }),
  }),
});

export const textBlockSchema = z.looseObject({
  type: z.literal("text"),
  text: z.string(),
});

export const toolUseBlockSchema = z.looseObject({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.unknown(),
});

const assistantSchema = z.looseObject({
  type: z.literal("assistant"),
  error: z.string().optional(),
  message: z.looseObject({ content: z.array(z.unknown()) }),
});

export const toolResultBlockSchema = z.looseObject({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  is_error: z.boolean().optional(),
});

const userSchema = z.looseObject({
  type: z.literal("user"),
  message: z.looseObject({
    content: z.union([z.string(), z.array(z.unknown())]),
  }),
});

const resultSchema = z.looseObject({
  type: z.literal("result"),
  is_error: z.boolean(),
  total_cost_usd: z.number().optional(),
  terminal_reason: z.string().optional(),
  result: z.string().optional(),
});

export const claudeLineSchema = z.union([
  initSchema,
  textDeltaSchema,
  assistantSchema,
  userSchema,
  resultSchema,
]);

export type ClaudeLine = z.infer<typeof claudeLineSchema>;
