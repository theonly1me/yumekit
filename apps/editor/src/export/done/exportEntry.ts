import { z } from "zod";
import type { ChatEntry } from "../../chat/chatSchemas.js";

const exportedFileSchema = z.object({
  platformId: z.string().optional(),
  path: z.string(),
  renderPath: z.string(),
  bytes: z.number(),
});

const exportJobSchema = z.object({
  callId: z.string(),
  outputId: z.string(),
  platformIds: z.array(z.string()),
  state: z.enum(["waiting", "exporting", "done", "failed"]),
  files: z.array(exportedFileSchema),
  shortSidePixels: z.number().optional(),
  failure: z
    .object({
      message: z.string(),
      sceneId: z.string().optional(),
      frame: z.number().optional(),
    })
    .optional(),
});

export const exportEntrySchema = z.object({
  kind: z.literal("export"),
  id: z.string(),
  by: z.enum(["approval", "person"]),
  state: z.enum(["running", "done", "failed"]),
  scale: z.union([z.literal(1), z.literal(0.5), z.literal(0.25)]),
  largestMegabytes: z.number().optional(),
  shortSidePixels: z.number().optional(),
  jobs: z.array(exportJobSchema),
});

export type ExportEntry = z.infer<typeof exportEntrySchema>;
export type EntryJob = ExportEntry["jobs"][number];
export type ExportedFile = EntryJob["files"][number];

export function newestExportOf(
  entries: readonly ChatEntry[],
): ExportEntry | undefined {
  return entries.findLast(
    (entry): entry is ExportEntry => entry.kind === "export",
  );
}
