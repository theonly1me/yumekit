import type { HarnessFailure } from "../../results.js";
import type { WorkItem, WorkStart } from "./workBoard.js";

function mediaBusyOf(options: {
  items: WorkItem[];
  start: WorkStart;
}): HarnessFailure | undefined {
  const { start } = options;
  const media = options.items.filter((item) => item.kind === "media");
  const sameId = media.find((item) => item.id === start.id);
  if (sameId !== undefined) {
    return {
      kind: "id-in-use",
      message: `A call that makes "${start.id}" is running now.`,
      hint: "Wait for its answer, or choose another asset_id.",
    };
  }
  const sameShot = media.find(
    (item) => start.shotId !== undefined && item.shotId === start.shotId,
  );
  if (sameShot !== undefined) {
    return {
      kind: "shot-call-running",
      message: `Shot "${start.shotId ?? ""}" has a call running now: "${sameShot.id}". One shot makes one try at a time, because each try needs its review first.`,
      hint: `Wait for "${sameShot.id}" and its review, then make the next try of the shot. Make other shots now.`,
    };
  }
  const sameEntry = media.find(
    (item) => start.castId !== undefined && item.castId === start.castId,
  );
  if (sameEntry !== undefined) {
    return {
      kind: "sheet-call-running",
      message: `The sheet of "${start.castId ?? ""}" has a call running now: "${sameEntry.id}". One entry makes one try at a time, because each try needs its review first.`,
      hint: `Wait for "${sameEntry.id}" and review the sheet, then make the next try. Make other sheets now.`,
    };
  }
  return undefined;
}

export function busyFailureOf(options: {
  items: WorkItem[];
  start: WorkStart;
}): HarnessFailure | undefined {
  const { start } = options;
  if (start.kind === "media") return mediaBusyOf(options);
  const sameSubject = options.items.find(
    (item) => item.kind === "review" && item.id === start.id,
  );
  if (sameSubject === undefined) return undefined;
  return {
    kind: "review-running",
    message: `The critic looks at ${start.subject} now.`,
    hint: "Wait for that answer. Never ask for a second review of the same work while one runs. Review other work now.",
  };
}
