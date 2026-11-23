import { useCallback, useMemo, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import {
  exportFailureSchema,
  exportResultSchema,
  fileNameOf,
  type ExportJob,
  type ExportScale,
  type JobState,
} from "./exportJobs.js";
import { withSharperCopy, type SharperRequest } from "./sharpenExport.js";

export type Exports = ReturnType<typeof useExports>;

async function exportOne(options: {
  client: EngineClient;
  job: ExportJob;
}): Promise<JobState> {
  const reply = await options.client.callTool({
    name: "render_video",
    input: {
      output_id: options.job.outputId,
      ...(options.job.scale === 1 ? {} : { scale: options.job.scale }),
    },
    callId: options.job.callId,
  });
  if (!reply.ok) {
    const message =
      reply.failure.kind === "request-failed"
        ? reply.failure.message
        : "The engine is not reachable. Check that yumekit open still runs.";
    return { kind: "failed", message, failedAt: undefined };
  }
  if (reply.value.isError) {
    const failure = exportFailureSchema.safeParse(reply.value.data);
    return failure.success
      ? {
          kind: "failed",
          message: failure.data.message,
          failedAt:
            failure.data.scene_id === undefined
              ? undefined
              : { sceneId: failure.data.scene_id, frame: failure.data.frame },
        }
      : { kind: "failed", message: reply.value.text, failedAt: undefined };
  }
  const result = exportResultSchema.safeParse(reply.value.data);
  if (!result.success) {
    return { kind: "failed", message: reply.value.text, failedAt: undefined };
  }
  const files = result.data.files ?? [{ file: result.data.file }];
  return {
    kind: "done",
    files: files.map((entry) => ({
      file: entry.file,
      fileName: fileNameOf(entry.file),
      platformId: entry.platform_id,
      isSharper: false,
    })),
    sharperFailure: undefined,
  };
}

export function useExports(client: EngineClient) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isRunning, setRunning] = useState(false);
  const isRunningNow = useRef(false);

  const setState = useCallback(
    (change: { callId: string; state: JobState }) => {
      setJobs((current) =>
        current.map((job) =>
          job.callId === change.callId ? { ...job, state: change.state } : job,
        ),
      );
    },
    [],
  );

  const start = useCallback(
    (request: {
      outputIds: string[];
      sharper: SharperRequest[];
      scale: ExportScale;
    }) => {
      const { outputIds, sharper, scale } = request;
      if (isRunningNow.current || outputIds.length === 0) return;
      isRunningNow.current = true;
      setRunning(true);
      const queued: ExportJob[] = outputIds.map((outputId) => ({
        callId: crypto.randomUUID(),
        outputId,
        scale,
        state: { kind: "waiting" },
      }));
      setJobs(queued);
      const stopListening = client.events.listen((event) => {
        if (event.type !== "call-progress") return;
        setJobs((current) =>
          current.map((job) =>
            job.callId === event.callId && job.state.kind === "exporting"
              ? {
                  ...job,
                  state: {
                    kind: "exporting",
                    framesDone: event.done,
                    frameCount: event.total,
                  },
                }
              : job,
          ),
        );
      });
      const runAll = async () => {
        for (const job of queued) {
          setState({
            callId: job.callId,
            state: { kind: "exporting", framesDone: 0, frameCount: undefined },
          });
          const exported = await exportOne({ client, job });
          setState({ callId: job.callId, state: exported });
          const request = sharper.find(
            (each) => each.outputId === job.outputId,
          );
          if (exported.kind !== "done" || request === undefined) continue;
          setState({
            callId: job.callId,
            state: { kind: "sharpening", files: exported.files },
          });
          setState({
            callId: job.callId,
            state: await withSharperCopy({
              client,
              request,
              files: exported.files,
            }),
          });
        }
      };
      runAll()
        .catch((error: unknown) => {
          setJobs((current) =>
            current.map((job) =>
              job.state.kind === "done"
                ? job
                : {
                    ...job,
                    state: {
                      kind: "failed",
                      message: String(error),
                      failedAt: undefined,
                    },
                  },
            ),
          );
        })
        .finally(() => {
          stopListening();
          isRunningNow.current = false;
          setRunning(false);
        });
    },
    [client, setState],
  );

  return useMemo(() => ({ jobs, isRunning, start }), [jobs, isRunning, start]);
}
