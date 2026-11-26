import { useEffect, useRef } from "react";
import type { Take } from "../takes/takeSchema.js";
import { playChime, showNotice, titleWithCount } from "./signals.js";

export function readyNoticeOf(take: Take): string {
  return take.step === "story"
    ? "The story is ready for you"
    : `Take ${String(take.number)} is ready for you`;
}

export function useReadySignal(options: {
  takes: readonly Take[];
  projectName: string;
}): void {
  const { takes, projectName } = options;
  const known = useRef<ReadonlySet<string> | undefined>(undefined);
  const readyIds = takes
    .filter((take) => take.state === "ready")
    .map((take) => take.id);
  const readyKey = readyIds.join(" ");

  useEffect(() => {
    const ready = takes.filter((take) => take.state === "ready");
    const previous = known.current;
    known.current = new Set(ready.map((take) => take.id));
    if (previous === undefined) return;
    const fresh = ready.filter((take) => !previous.has(take.id));
    if (fresh.length === 0) return;
    playChime();
    for (const take of fresh) showNotice(readyNoticeOf(take));
  }, [takes]);

  useEffect(() => {
    document.title = titleWithCount({
      base: projectName,
      count: readyKey === "" ? 0 : readyKey.split(" ").length,
    });
  }, [projectName, readyKey]);
}
