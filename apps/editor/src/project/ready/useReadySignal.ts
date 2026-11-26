import { useEffect, useRef } from "react";
import { takeTitleOf } from "@yumekit/project/takes";
import type { Chapter, Take } from "../takes/takeTypes.js";
import { playChime, showNotice, titleWithCount } from "./signals.js";

export function readyNoticeOf(options: {
  take: Take;
  chapters: readonly Chapter[];
}): string {
  return `${takeTitleOf(options)} is ready for you`;
}

export function useReadySignal(options: {
  takes: readonly Take[];
  chapters: readonly Chapter[];
  projectName: string;
}): void {
  const { takes, chapters, projectName } = options;
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
    for (const take of fresh) showNotice(readyNoticeOf({ take, chapters }));
  }, [takes, chapters]);

  useEffect(() => {
    document.title = titleWithCount({
      base: projectName,
      count: readyKey === "" ? 0 : readyKey.split(" ").length,
    });
  }, [projectName, readyKey]);
}
