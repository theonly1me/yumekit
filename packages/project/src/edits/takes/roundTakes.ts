import type { ProjectState } from "../../format/state.js";
import type { Take, TakeItem, TakeStep } from "../../format/takes.js";
import { succeed } from "../../outcome.js";
import { chaptersOf } from "../../takes/chapters.js";
import { nextTakeNumberOf, openTakeOf } from "../../takes/verdicts.js";
import type { EditOfKind } from "../edit.js";
import { problem, type EditProblem, type EditResult } from "../editFailure.js";

interface Problem {
  ok: false;
  failure: EditProblem;
}

export function withTake(options: {
  state: ProjectState;
  take: Take;
}): ProjectState {
  const { state, take } = options;
  return {
    ...state,
    takes: state.takes.map((candidate) =>
      candidate.id === take.id ? take : candidate,
    ),
  };
}

export function takeOf(options: {
  state: ProjectState;
  takeId: string;
}): Take | Problem {
  const take = options.state.takes.find(
    (candidate) => candidate.id === options.takeId,
  );
  return (
    take ??
    problem({
      kind: "not-found",
      message: `The take "${options.takeId}" does not exist.`,
    })
  );
}

function chapterProblemOf(options: {
  state: ProjectState;
  chapterId: string | undefined;
  step: TakeStep;
}): Problem | undefined {
  const { chapterId, step } = options;
  if (step === "story") {
    return chapterId === undefined
      ? undefined
      : problem({
          kind: "invalid-value",
          message: "A take of the story belongs to no chapter.",
        });
  }
  if (chapterId === undefined) {
    return problem({
      kind: "invalid-value",
      message: `A take of the ${step} needs the chapter that it makes.`,
    });
  }
  const chapters = chaptersOf(options.state.bible.storyPlan);
  return chapters.some((chapter) => chapter.id === chapterId)
    ? undefined
    : problem({
        kind: "not-found",
        message: `The chapter "${chapterId}" does not exist. The chapters are ${chapters.map((chapter) => `"${chapter.id}"`).join(", ")}.`,
      });
}

function itemsProblemOf(options: {
  state: ProjectState;
  items: readonly TakeItem[];
}): Problem | undefined {
  const ids = options.items.map((item) => item.id);
  const repeated = ids.find((...[id, index]) => ids.indexOf(id) !== index);
  if (repeated !== undefined) {
    return problem({
      kind: "id-in-use",
      message: `The take names the item "${repeated}" twice.`,
    });
  }
  const missing = options.items.find(
    (item) =>
      item.kind === "asset" &&
      !options.state.assets.some((asset) => asset.id === item.id),
  );
  return missing === undefined
    ? undefined
    : problem({
        kind: "not-found",
        message: `The asset "${missing.id}" of the take does not exist.`,
      });
}

export function openTake(options: {
  state: ProjectState;
  edit: EditOfKind<"openTake">;
}): EditResult {
  const { state, edit } = options;
  if (state.takes.some((take) => take.id === edit.takeId)) {
    return problem({
      kind: "id-in-use",
      message: `The take "${edit.takeId}" already exists.`,
    });
  }
  const chapterProblem = chapterProblemOf({
    state,
    chapterId: edit.chapterId,
    step: edit.step,
  });
  if (chapterProblem !== undefined) return chapterProblem;
  const open = openTakeOf(state.takes);
  if (open !== undefined && open.items.length > 0) {
    return problem({
      kind: "invalid-value",
      message: `Take ${String(open.number)} ("${open.id}") is open with ${String(open.items.length)} items. It becomes ready before another take opens.`,
    });
  }
  const takes = state.takes.filter((take) => take !== open);
  const take: Take = {
    id: edit.takeId,
    ...(edit.chapterId === undefined ? {} : { chapterId: edit.chapterId }),
    step: edit.step,
    number: nextTakeNumberOf({ takes, chapterId: edit.chapterId }),
    state: "open",
    openedAt: edit.at,
    items: [],
    notes: [],
  };
  return succeed({ ...state, takes: [...takes, take] });
}

export function fillTake(options: {
  state: ProjectState;
  edit: EditOfKind<"fillTake">;
}): EditResult {
  const { state, edit } = options;
  const open = openTakeOf(state.takes);
  if (open === undefined) return succeed(state);
  const itemsProblem = itemsProblemOf({ state, items: edit.items });
  if (itemsProblem !== undefined) return itemsProblem;
  const kept = open.items.filter(
    (item) =>
      !edit.items.some(
        (added) => added.id === item.id && added.kind === item.kind,
      ),
  );
  const added = edit.items.filter(
    (item) => !kept.some((existing) => existing.id === item.id),
  );
  return succeed(
    withTake({ state, take: { ...open, items: [...kept, ...added] } }),
  );
}

export function readyTake(options: {
  state: ProjectState;
  edit: EditOfKind<"readyTake">;
}): EditResult {
  const { state, edit } = options;
  const take = takeOf({ state, takeId: edit.takeId });
  if ("ok" in take) return take;
  if (take.state !== "open") {
    return problem({
      kind: "invalid-value",
      message: `Take ${String(take.number)} is ${take.state}. Only an open take becomes ready.`,
    });
  }
  const itemsProblem = itemsProblemOf({ state, items: edit.items });
  if (itemsProblem !== undefined) return itemsProblem;
  return succeed(
    withTake({
      state,
      take: {
        ...take,
        state: "ready",
        readyAt: edit.at,
        items: edit.items,
        costUsd: edit.costUsd,
        ...(edit.nextStepEstimateUsd === undefined
          ? {}
          : { nextStepEstimateUsd: edit.nextStepEstimateUsd }),
      },
    }),
  );
}
