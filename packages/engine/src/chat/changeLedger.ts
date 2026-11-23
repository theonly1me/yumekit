import { randomUUID } from "node:crypto";
import { personSentenceOf } from "@yumekit/brain";
import type { ChatLog } from "./chatLog.js";
import type { ChangeAuthor, ChangeEntry } from "./chatTypes.js";
import type { StoreCommit, ToolCaller } from "./trackedStore.js";

export const aiChangingSummary = "The AI is changing the project.";
export const agentChangeSummary = "An agent changed the project.";

export interface ChangeLedger {
  onCommit: (commit: StoreCommit) => void;
  beginRequest: () => void;
  endRequest: (summary: string) => void;
  changeOf: (changeId: string) => ChangeEntry | undefined;
}

function summaryOf(caller: ToolCaller | undefined): string {
  if (caller?.by === "ai") return agentChangeSummary;
  return caller?.summary ?? personSentenceOf(caller?.tool ?? "");
}

export function createChangeLedger(log: ChatLog): ChangeLedger {
  let request: { changeId: string | undefined } | undefined;
  const changeIdsByAct = new Map<string, string>();
  const changeOf = (changeId: string) =>
    log
      .entries()
      .find(
        (entry): entry is ChangeEntry =>
          entry.kind === "change" && entry.id === changeId,
      );
  const addStep = (step: { changeId: string; summary?: string }) => {
    const { changeId, summary } = step;
    const change = changeOf(changeId);
    if (change === undefined) return;
    log.put({
      ...change,
      ...(summary === undefined ? {} : { summary }),
      undoSteps: change.undoSteps + 1,
      undone: false,
    });
  };
  const newChange = (options: { by: ChangeAuthor; summary: string }) => {
    const id = randomUUID();
    log.put({ kind: "change", id, undoSteps: 1, undone: false, ...options });
    return id;
  };
  const recordEdit = (caller: ToolCaller | undefined) => {
    log.clearRedo();
    if (caller?.by === "ai" && request !== undefined) {
      if (request.changeId === undefined) {
        request.changeId = newChange({ by: "ai", summary: aiChangingSummary });
      } else addStep({ changeId: request.changeId });
      return;
    }
    if (caller?.changeId !== undefined) {
      addStep({ changeId: caller.changeId });
      return;
    }
    const actChangeId =
      caller?.actId === undefined
        ? undefined
        : changeIdsByAct.get(caller.actId);
    if (actChangeId !== undefined && changeOf(actChangeId) !== undefined) {
      addStep({ changeId: actChangeId, summary: summaryOf(caller) });
      if (caller !== undefined) caller.changeId = actChangeId;
      return;
    }
    const changeId = newChange({
      by: caller?.by ?? "person",
      summary: summaryOf(caller),
    });
    if (caller === undefined) return;
    caller.changeId = changeId;
    if (caller.actId !== undefined) changeIdsByAct.set(caller.actId, changeId);
  };
  const recordUndo = () => {
    const change = log
      .entries()
      .findLast(
        (entry): entry is ChangeEntry =>
          entry.kind === "change" && !entry.undone && entry.undoSteps > 0,
      );
    if (change === undefined) return;
    const undoSteps = change.undoSteps - 1;
    log.put({ ...change, undoSteps, undone: undoSteps === 0 });
    log.pushRedo(change.id);
  };
  const recordRedo = () => {
    const changeId = log.popRedo();
    if (changeId !== undefined) addStep({ changeId });
  };
  return {
    onCommit: (commit) => {
      switch (commit.kind) {
        case "edit":
          recordEdit(commit.caller);
          return;
        case "undo":
          recordUndo();
          return;
        case "redo":
          recordRedo();
          return;
      }
    },
    beginRequest: () => {
      request = { changeId: undefined };
    },
    endRequest: (summary) => {
      const changeId = request?.changeId;
      request = undefined;
      if (changeId === undefined) return;
      const change = changeOf(changeId);
      if (change !== undefined) log.put({ ...change, summary });
    },
    changeOf,
  };
}
