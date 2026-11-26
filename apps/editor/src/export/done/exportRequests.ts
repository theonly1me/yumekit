import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";
import type { ExportScale } from "../exportJobs.js";
import {
  renderInputOf,
  type FileSizeChoice,
} from "../fileSize/fileSizeChoice.js";
import { exportEntrySchema } from "./exportEntry.js";

const revealedSchema = z.object({ file: z.string() });

export function startExport(options: {
  client: EngineClient;
  outputIds: string[];
  scale: ExportScale;
  fileSize: FileSizeChoice;
}) {
  return options.client.readJson({
    path: "/api/exports",
    schema: exportEntrySchema,
    body: {
      output_ids: options.outputIds,
      scale: options.scale,
      ...renderInputOf(options.fileSize),
    },
  });
}

export function revealExport(options: { client: EngineClient; path: string }) {
  return options.client.readJson({
    path: "/api/exports/reveal",
    schema: revealedSchema,
    body: { path: options.path },
  });
}
