import { z } from "zod";

export const exportScales = [1, 0.5, 0.25] as const;

const exportedFileSchema = z.object({
  platformId: z.string().optional(),
  path: z.string(),
  renderPath: z.string(),
  bytes: z.number().int().min(0),
});

const exportFailureSchema = z.object({
  message: z.string(),
  sceneId: z.string().optional(),
  frame: z.number().int().min(0).optional(),
});

const exportJobSchema = z.object({
  callId: z.string(),
  outputId: z.string(),
  platformIds: z.array(z.string()),
  state: z.enum(["waiting", "exporting", "done", "failed"]),
  files: z.array(exportedFileSchema),
  shortSidePixels: z.number().int().min(1).optional(),
  failure: exportFailureSchema.optional(),
});

export const exportEntrySchema = z.object({
  kind: z.literal("export"),
  id: z.string(),
  by: z.enum(["approval", "person"]),
  state: z.enum(["running", "done", "failed"]),
  scale: z.union([z.literal(1), z.literal(0.5), z.literal(0.25)]),
  largestMegabytes: z.number().positive().optional(),
  shortSidePixels: z.number().int().min(1).optional(),
  jobs: z.array(exportJobSchema),
});

export type ExportEntry = z.infer<typeof exportEntrySchema>;
export type ExportJob = ExportEntry["jobs"][number];
export type ExportedFile = ExportJob["files"][number];
export type ExportFailure = z.infer<typeof exportFailureSchema>;
export type ExportScale = ExportEntry["scale"];

export const stoppedExportMessage =
  "The export stopped when yumekit closed. Export again.";

export function stoppedExportOf(entry: ExportEntry): ExportEntry {
  if (entry.state !== "running") return entry;
  return {
    ...entry,
    state: "failed",
    jobs: entry.jobs.map((job) =>
      job.state === "done"
        ? job
        : {
            ...job,
            state: "failed",
            failure: { message: stoppedExportMessage },
          },
    ),
  };
}
