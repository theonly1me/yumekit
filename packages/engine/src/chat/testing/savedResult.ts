import { readFile } from "node:fs/promises";
import { z } from "zod";

const savedResultSchema = z.object({
  isError: z.boolean(),
  data: z.record(z.string(), z.unknown()),
  mcpResult: z.object({
    content: z.array(z.looseObject({ type: z.string() })),
    structuredContent: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type SavedResult = z.infer<typeof savedResultSchema>;

export async function savedResultOf(file: string): Promise<SavedResult> {
  return savedResultSchema.parse(JSON.parse(await readFile(file, "utf8")));
}

export function firstTextOf(result: SavedResult): string {
  const [first] = result.mcpResult.content;
  const text: unknown = first?.["text"];
  return typeof text === "string" ? text : "";
}
