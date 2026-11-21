import { useCallback, useMemo, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import {
  progressEventSchema,
  renderFailureSchema,
  renderResultSchema,
  fileNameOf,
  type JobState,
  type RenderJob,
} from "./renderJobs.js";

export type Renders = ReturnType<typeof useRenders>;

function progressOf(data: unknown) {
  if (typeof data !== "string") return undefined;
  try {
    const parsed = progressEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

async function renderOne(options: {
  client: EngineClient;
  job: RenderJob;
}): Promise<JobState> {
  const reply = await options.client.callTool({
    name: "render_video",
    input: { output_id: options.job.outputId },
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
    const failure = renderFailureSchema.safeParse(reply.value.data);
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
  const result = renderResultSchema.safeParse(reply.value.data);
  if (!result.success) {
    return { kind: "failed", message: reply.value.text, failedAt: undefined };
  }
  return {
    kind: "done",
    file: result.data.file,
    fileName: fileNameOf(result.data.file),
    durationSeconds: result.data.duration_seconds,
  };
}

export function useRenders(client: EngineClient) {
  const [jobs, setJobs] = useState<RenderJob[]>([]);
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
    (outputIds: string[]) => {
      if (isRunningNow.current || outputIds.length === 0) return;
      isRunningNow.current = true;
      setRunning(true);
      const queued: RenderJob[] = outputIds.map((outputId) => ({
        callId: crypto.randomUUID(),
        outputId,
        state: { kind: "waiting" },
      }));
      setJobs(queued);
      const socket = new WebSocket(client.eventsUrl());
      socket.addEventListener("message", (event) => {
        const progress = progressOf(event.data);
        if (progress === undefined) return;
        setJobs((current) =>
          current.map((job) =>
            job.callId === progress.callId && job.state.kind === "rendering"
              ? {
                  ...job,
                  state: {
                    kind: "rendering",
                    framesDone: progress.done,
                    frameCount: progress.total,
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
            state: { kind: "rendering", framesDone: 0, frameCount: undefined },
          });
          setState({
            callId: job.callId,
            state: await renderOne({ client, job }),
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
          socket.close();
          isRunningNow.current = false;
          setRunning(false);
        });
    },
    [client, setState],
  );

  return useMemo(() => ({ jobs, isRunning, start }), [jobs, isRunning, start]);
}
