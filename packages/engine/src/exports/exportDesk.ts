import { randomUUID } from "node:crypto";
import type { Harness } from "@yumekit/harness-mcp";
import type { ProjectStore } from "@yumekit/project";
import type { Outcome } from "../engineTypes.js";
import type { EventHub } from "../events/eventHub.js";
import type { ChatLog } from "../chat/chatLog.js";
import type { ExportEntry, ExportJob, ExportScale } from "./exportEntry.js";
import { exportJobsOf } from "./exportPlan.js";
import { runExportJob } from "./runExportJob.js";

export interface ExportRequest {
  by: ExportEntry["by"];
  outputIds: readonly string[];
  scale: ExportScale;
  largestMegabytes?: number | undefined;
  shortSidePixels?: number | undefined;
}

export interface ExportStartFailure {
  kind: "export-running" | "nothing-to-export";
  message: string;
}

export interface ExportDesk {
  start: (request: ExportRequest) => Outcome<ExportEntry, ExportStartFailure>;
  close: () => void;
}

function isRunning(entry: ExportEntry | undefined): boolean {
  return entry?.state === "running";
}

export function createExportDesk(options: {
  log: ChatLog;
  events: EventHub;
  store: ProjectStore;
  harness: Harness;
  projectFolder: string;
}): ExportDesk {
  const { log } = options;
  let current: ExportEntry | undefined;
  let isClosing = false;

  const put = (entry: ExportEntry) => {
    current = entry;
    if (!isClosing) log.put(entry);
  };
  const putJob = (job: ExportJob) => {
    if (current === undefined) return;
    put({
      ...current,
      jobs: current.jobs.map((each) =>
        each.callId === job.callId ? job : each,
      ),
    });
  };
  const runAll = async (entry: ExportEntry) => {
    for (const job of entry.jobs) {
      if (isClosing) return;
      putJob({ ...job, state: "exporting" });
      const ran = await runExportJob({ ...options, entry, job }).catch(
        (error: unknown): ExportJob => ({
          ...job,
          state: "failed",
          failure: { message: String(error) },
        }),
      );
      putJob(ran);
    }
    if (current === undefined) return;
    put({
      ...current,
      state: current.jobs.every((job) => job.state === "done")
        ? "done"
        : "failed",
    });
  };

  return {
    start: (request) => {
      if (isRunning(current)) {
        return {
          ok: false,
          failure: {
            kind: "export-running",
            message: "An export runs now. Wait until it is done.",
          },
        };
      }
      const jobs = exportJobsOf({
        snapshot: options.store.read(),
        outputIds: request.outputIds,
      });
      if (jobs.length === 0) {
        return {
          ok: false,
          failure: {
            kind: "nothing-to-export",
            message: "The project has none of these outputs.",
          },
        };
      }
      const entry: ExportEntry = {
        kind: "export",
        id: randomUUID(),
        by: request.by,
        state: "running",
        scale: request.scale,
        ...(request.largestMegabytes === undefined
          ? {}
          : { largestMegabytes: request.largestMegabytes }),
        ...(request.shortSidePixels === undefined
          ? {}
          : { shortSidePixels: request.shortSidePixels }),
        jobs,
      };
      put(entry);
      runAll(entry).catch(() => undefined);
      return { ok: true, value: entry };
    },
    close: () => {
      isClosing = true;
    },
  };
}
