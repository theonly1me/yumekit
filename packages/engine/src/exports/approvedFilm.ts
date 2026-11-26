import { chaptersOf, type ProjectSnapshot, type Take } from "@yumekit/project";
import type { ExportDesk } from "./exportDesk.js";
import { filmOutputIdsOf } from "./exportPlan.js";

export function isApprovedLastCut(options: {
  snapshot: ProjectSnapshot;
  take: Take;
}): boolean {
  const { take } = options;
  if (take.step !== "cut" || take.state !== "sent") return false;
  const lastChapter = chaptersOf(options.snapshot.bible.storyPlan).at(-1);
  return (
    lastChapter?.id === take.chapterId &&
    take.items.length > 0 &&
    take.items.every((item) => item.approved === true)
  );
}

export function exportApprovedFilm(options: {
  snapshot: ProjectSnapshot;
  take: Take;
  exports: ExportDesk;
}): void {
  if (!isApprovedLastCut(options)) return;
  options.exports.start({
    by: "approval",
    outputIds: filmOutputIdsOf(options.snapshot),
    scale: 1,
  });
}
