import { useCallback, useRef, useState } from "react";
import type { ChatEntry } from "../chat/chatSchemas.js";
import type { EngineClient } from "../engine/engineClient.js";
import { failureTextOf } from "../tools/requestText.js";
import { newestExportOf, type ExportEntry } from "./done/exportEntry.js";
import { startExport } from "./done/exportRequests.js";
import {
  jobsOfEntry,
  madeFilesOf,
  type SharperByOutput,
  type SharperState,
} from "./done/jobsOfEntry.js";
import { useExportProgress } from "./done/useExportProgress.js";
import type { ExportScale } from "./exportJobs.js";
import type { FileSizeChoice } from "./fileSize/fileSizeChoice.js";
import { withSharperCopy, type SharperRequest } from "./sharpenExport.js";

export type Exports = ReturnType<typeof useExports>;

export interface ExportStart {
  outputIds: string[];
  sharper: SharperRequest[];
  scale: ExportScale;
  fileSize: FileSizeChoice;
}

interface KeptSharper {
  entryId: string;
  byOutput: SharperByOutput;
}

export function useExports(options: {
  client: EngineClient;
  entries: readonly ChatEntry[];
}) {
  const { client } = options;
  const entry = newestExportOf(options.entries);
  const progress = useExportProgress({ client, entry });
  const [sharper, setSharper] = useState<KeptSharper>();
  const [isStarting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string>();
  const isStartingNow = useRef(false);

  const setSharperOf = useCallback(
    (change: { entryId: string; outputId: string; state: SharperState }) => {
      setSharper((current) => {
        const byOutput = new Map(
          current?.entryId === change.entryId ? current.byOutput : [],
        );
        byOutput.set(change.outputId, change.state);
        return { entryId: change.entryId, byOutput };
      });
    },
    [],
  );

  const sharpen = useCallback(
    async (request: { entry: ExportEntry; sharper: SharperRequest[] }) => {
      for (const job of request.entry.jobs) {
        const asked = request.sharper.find(
          (each) => each.outputId === job.outputId,
        );
        if (job.state !== "done" || asked === undefined) continue;
        const change = { entryId: request.entry.id, outputId: job.outputId };
        setSharperOf({ ...change, state: { kind: "sharpening" } });
        const done = await withSharperCopy({
          client,
          request: asked,
          files: madeFilesOf(job),
        });
        setSharperOf({
          ...change,
          state: {
            kind: "done",
            files: done.files,
            failure: done.sharperFailure,
          },
        });
      }
    },
    [client, setSharperOf],
  );

  const start = useCallback(
    (request: ExportStart) => {
      if (isStartingNow.current || request.outputIds.length === 0) return;
      isStartingNow.current = true;
      setStarting(true);
      setFailure(undefined);
      const finished = new Map<string, ExportEntry>();
      let startedId: string | undefined;
      const sharpenOnce = (done: ExportEntry) => {
        stopListening();
        sharpen({ entry: done, sharper: request.sharper }).catch(
          (error: unknown) => {
            setFailure(String(error));
          },
        );
      };
      const stopListening = client.events.listen((event) => {
        if (event.type !== "chat-changed" || event.entry.kind !== "export") {
          return;
        }
        if (event.entry.state === "running") return;
        finished.set(event.entry.id, event.entry);
        if (event.entry.id === startedId) sharpenOnce(event.entry);
      });
      startExport({ client, ...request })
        .then((started) => {
          if (!started.ok) {
            stopListening();
            setFailure(failureTextOf(started.failure));
            return;
          }
          startedId = started.value.id;
          const done = finished.get(startedId);
          if (request.sharper.length === 0) stopListening();
          else if (done !== undefined) sharpenOnce(done);
        })
        .catch((error: unknown) => {
          stopListening();
          setFailure(String(error));
        })
        .finally(() => {
          isStartingNow.current = false;
          setStarting(false);
        });
    },
    [client, sharpen],
  );

  const byOutput: SharperByOutput =
    sharper !== undefined && sharper.entryId === entry?.id
      ? sharper.byOutput
      : new Map();
  const jobs = jobsOfEntry({ entry, progress, sharper: byOutput });
  const isRunning =
    isStarting ||
    entry?.state === "running" ||
    jobs.some((job) => job.state.kind === "sharpening");
  return { entry, progress, jobs, isRunning, failure, start };
}
