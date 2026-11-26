import type { Harness } from "@yumekit/harness-mcp";
import type { ProjectStore } from "@yumekit/project";
import { z } from "zod";
import type { EventHub } from "../events/eventHub.js";
import type { ExportEntry, ExportJob } from "./exportEntry.js";
import { exportNameOf, placeExport } from "./exportFiles.js";

const renderedSchema = z.object({
  file: z.string(),
  width_pixels: z.number().optional(),
  height_pixels: z.number().optional(),
  files: z
    .array(z.object({ file: z.string(), platform_id: z.string().optional() }))
    .optional(),
});

const renderFailureSchema = z.object({
  message: z.string(),
  scene_id: z.string().optional(),
  frame: z.number().int().min(0).optional(),
});

function renderInputOf(options: { entry: ExportEntry; job: ExportJob }) {
  const { entry, job } = options;
  return {
    output_id: job.outputId,
    ...(entry.scale === 1 ? {} : { scale: entry.scale }),
    ...(entry.largestMegabytes === undefined
      ? {}
      : { largest_megabytes: entry.largestMegabytes }),
    ...(entry.shortSidePixels === undefined
      ? {}
      : { short_side_pixels: entry.shortSidePixels }),
  };
}

function failedJob(options: {
  job: ExportJob;
  failure: ExportJob["failure"];
}): ExportJob {
  return { ...options.job, state: "failed", failure: options.failure };
}

export async function runExportJob(options: {
  harness: Harness;
  store: ProjectStore;
  events: EventHub;
  projectFolder: string;
  entry: ExportEntry;
  job: ExportJob;
}): Promise<ExportJob> {
  const { job, events } = options;
  const result = await options.harness.call({
    name: "render_video",
    input: renderInputOf(options),
    by: "person",
    onProgress: (progress) => {
      events.send({ type: "call-progress", callId: job.callId, ...progress });
    },
  });
  if (result.isError) {
    const failure = renderFailureSchema.safeParse(result.data);
    return failedJob({
      job,
      failure: failure.success
        ? {
            message: failure.data.message,
            ...(failure.data.scene_id === undefined
              ? {}
              : { sceneId: failure.data.scene_id }),
            ...(failure.data.frame === undefined
              ? {}
              : { frame: failure.data.frame }),
          }
        : { message: result.text },
    });
  }
  const rendered = renderedSchema.safeParse(result.data);
  if (!rendered.success) {
    return failedJob({ job, failure: { message: result.text } });
  }
  const { width_pixels: width, height_pixels: height } = rendered.data;
  const renderFiles = rendered.data.files ?? [{ file: rendered.data.file }];
  const projectName = options.store.read().project.name;
  const files: ExportJob["files"] = [];
  for (const renderFile of renderFiles) {
    const placed = await placeExport({
      projectFolder: options.projectFolder,
      renderFile: renderFile.file,
      name: exportNameOf({
        renderFile: renderFile.file,
        projectName,
        platformId: renderFile.platform_id,
      }),
    });
    if (!placed.ok) {
      return failedJob({ job, failure: { message: placed.failure.message } });
    }
    files.push({
      ...(renderFile.platform_id === undefined
        ? {}
        : { platformId: renderFile.platform_id }),
      path: placed.value.path,
      renderPath: renderFile.file,
      bytes: placed.value.bytes,
    });
  }
  return {
    ...job,
    state: "done",
    files,
    ...(width === undefined || height === undefined
      ? {}
      : { shortSidePixels: Math.min(width, height) }),
  };
}
