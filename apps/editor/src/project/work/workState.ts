import type { Chapter, Take } from "../takes/takeTypes.js";
import { takesOfChapter } from "../takes/verdicts.js";

export type ViewChoice =
  | { kind: "auto" }
  | { kind: "story" }
  | { kind: "take"; takeId: string }
  | { kind: "film" };

export type WaitingPhase = "reading" | "questions" | "working";

export type WorkState =
  | { kind: "failed"; failureKind: string }
  | { kind: "waiting"; phase: WaitingPhase }
  | { kind: "making"; take: Take }
  | { kind: "story"; take: Take | undefined }
  | { kind: "take"; take: Take }
  | { kind: "film"; take: Take | undefined }
  | { kind: "empty" };

export interface WorkFacts {
  takes: readonly Take[];
  chapterId: string;
  hasStory: boolean;
  isStoryApproved: boolean;
  isLeadRunning: boolean;
  hasOpenQuestions: boolean;
  hasRequest: boolean;
  startFailure: string | undefined;
}

function inChapter(options: { take: Take; chapterId: string }): boolean {
  return (
    options.take.step === "story" ||
    options.take.chapterId === options.chapterId
  );
}

export function autoChapterIdOf(options: {
  takes: readonly Take[];
  chapters: readonly Chapter[];
}): string | undefined {
  const byState = (state: Take["state"]) =>
    options.takes.find(
      (take) => take.state === state && take.chapterId !== undefined,
    );
  const newest = options.takes
    .filter((take) => take.chapterId !== undefined)
    .toSorted((...[first, second]) =>
      first.openedAt.localeCompare(second.openedAt),
    )
    .at(-1);
  const take = byState("open") ?? byState("ready") ?? newest;
  return take?.chapterId ?? options.chapters[0]?.id;
}

function stateOfTake(take: Take): WorkState {
  if (take.state === "open") return { kind: "making", take };
  if (take.step === "story") return { kind: "story", take };
  if (take.step === "cut") return { kind: "film", take };
  return { kind: "take", take };
}

function lastStoryTake(takes: readonly Take[]): Take | undefined {
  return takes.filter((take) => take.step === "story").at(-1);
}

function autoStateOf(facts: WorkFacts): WorkState {
  const own = facts.takes.filter((take) =>
    inChapter({ take, chapterId: facts.chapterId }),
  );
  const live =
    own.find((take) => take.state === "open") ??
    own.find((take) => take.state === "ready");
  if (live !== undefined) return stateOfTake(live);
  if (facts.isLeadRunning) {
    const isFresh = !facts.hasStory && facts.takes.length === 0;
    return { kind: "waiting", phase: isFresh ? "reading" : "working" };
  }
  if (facts.hasOpenQuestions) return { kind: "waiting", phase: "questions" };
  if (facts.hasStory && !facts.isStoryApproved) {
    return { kind: "story", take: lastStoryTake(facts.takes) };
  }
  const newest = takesOfChapter({
    takes: facts.takes,
    chapterId: facts.chapterId,
  }).at(-1);
  if (newest !== undefined) return stateOfTake(newest);
  return facts.hasStory
    ? { kind: "story", take: lastStoryTake(facts.takes) }
    : { kind: "empty" };
}

export function workStateOf(options: {
  facts: WorkFacts;
  choice: ViewChoice;
}): WorkState {
  const { facts, choice } = options;
  if (facts.startFailure !== undefined && !facts.hasRequest) {
    return { kind: "failed", failureKind: facts.startFailure };
  }
  switch (choice.kind) {
    case "auto":
      return autoStateOf(facts);
    case "story":
      return { kind: "story", take: lastStoryTake(facts.takes) };
    case "film":
      return {
        kind: "film",
        take: takesOfChapter(facts)
          .filter((take) => take.step === "cut")
          .at(-1),
      };
    case "take": {
      const take = facts.takes.find(
        (candidate) => candidate.id === choice.takeId,
      );
      return take === undefined ? autoStateOf(facts) : stateOfTake(take);
    }
  }
}
