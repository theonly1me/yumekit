import { useEffect, useRef, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { ExportEntry } from "./exportEntry.js";

export interface FrameProgress {
  done: number;
  total: number | undefined;
}

export type ProgressByCall = ReadonlyMap<string, FrameProgress>;

export function useExportProgress(options: {
  client: EngineClient;
  entry: ExportEntry | undefined;
}): ProgressByCall {
  const { client, entry } = options;
  const [progress, setProgress] = useState<ProgressByCall>(new Map());
  const callIds = useRef<ReadonlySet<string>>(new Set());
  const callIdKey = entry?.jobs.map((job) => job.callId).join(" ") ?? "";

  useEffect(() => {
    callIds.current = new Set(callIdKey.split(" "));
  }, [callIdKey]);

  useEffect(
    () =>
      client.events.listen((event) => {
        if (event.type !== "call-progress") return;
        if (!callIds.current.has(event.callId)) return;
        setProgress((current) => {
          const next = new Map(
            [...current].filter(([callId]) => callIds.current.has(callId)),
          );
          next.set(event.callId, { done: event.done, total: event.total });
          return next;
        });
      }),
    [client],
  );

  return progress;
}
