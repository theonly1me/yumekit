import type { ChatEntry } from "../../chat/chatSchemas.js";
import { shownRequestTextOf } from "../../chat/requestEntryText.js";
import type { Snapshot } from "../../engine/snapshot.js";
import type { Chapter, Take } from "../takes/takeTypes.js";
import { chaptersOf, takesOfChapter } from "../takes/verdicts.js";
import { autoChapterIdOf } from "./workState.js";

export interface ProjectFacts {
  takes: Take[];
  chapters: Chapter[];
  chapterId: string;
  chapterIndex: number;
  hasStory: boolean;
  isStoryApproved: boolean;
  hasOpenQuestions: boolean;
  hasRequest: boolean;
  requestText: string;
  hasAiVideo: boolean;
}

export function projectFactsOf(options: {
  snapshot: Snapshot;
  entries: ChatEntry[];
  pickedChapterId: string | undefined;
}): ProjectFacts {
  const { snapshot, entries } = options;
  const takes = snapshot.takes ?? [];
  const chapters = chaptersOf(snapshot.bible.storyPlan);
  const picked = chapters.find(
    (chapter) => chapter.id === options.pickedChapterId,
  );
  const chapterId =
    picked?.id ?? autoChapterIdOf({ takes, chapters }) ?? chapters[0]?.id ?? "";
  const story = snapshot.bible.story;
  const firstRequest = entries.find((entry) => entry.kind === "request");
  return {
    takes,
    chapters,
    chapterId,
    chapterIndex: chapters.findIndex((chapter) => chapter.id === chapterId),
    hasStory: story !== undefined,
    isStoryApproved: story?.approval !== undefined,
    hasOpenQuestions: entries.some(
      (entry) => entry.kind === "questions" && entry.state === "open",
    ),
    hasRequest: firstRequest !== undefined,
    requestText:
      firstRequest?.kind === "request" ? shownRequestTextOf(firstRequest) : "",
    hasAiVideo: (snapshot.project.videoStyle ?? "graphics") !== "graphics",
  };
}

export function takeCostOf(options: {
  take: Take;
  snapshot: Snapshot;
}): number {
  if (options.take.costUsd !== undefined) return options.take.costUsd;
  return options.take.items.reduce((...[sum, item]) => {
    const asset = options.snapshot.assets.find((each) => each.id === item.id);
    const cost =
      asset?.source.kind === "tool" ? (asset.source.costUsd ?? 0) : 0;
    return sum + cost;
  }, 0);
}

export function latestTakeIdOf(options: {
  takes: readonly Take[];
  take: Take;
}): string | undefined {
  const { take } = options;
  const siblings =
    take.chapterId === undefined
      ? options.takes.filter((each) => each.step === take.step)
      : takesOfChapter({ takes: options.takes, chapterId: take.chapterId });
  return siblings.at(-1)?.id;
}

export function chapterLineOf(facts: ProjectFacts): string {
  const chapter = facts.chapters[facts.chapterIndex];
  if (chapter === undefined || facts.chapters.length < 2) {
    return "The cut of the film";
  }
  return `Chapter ${String(facts.chapterIndex + 1)}, ${chapter.title}`;
}
