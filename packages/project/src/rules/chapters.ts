import type { ProjectState } from "../format/state.js";
import type { RuleFailure } from "./ruleFailure.js";

const bibleFile = "bible.json";

function repeatedOf(ids: readonly string[]): string | undefined {
  return ids.find((...[id, index]) => ids.indexOf(id) !== index);
}

export function checkChapters(state: ProjectState): RuleFailure | undefined {
  const plan = state.bible.storyPlan;
  const chapters = plan?.chapters;
  if (plan === undefined || chapters === undefined) return undefined;
  const repeatedChapter = repeatedOf(chapters.map((chapter) => chapter.id));
  if (repeatedChapter !== undefined) {
    return {
      kind: "id-in-use",
      file: bibleFile,
      message: `Two chapters have the id "${repeatedChapter}".`,
    };
  }
  const planShotIds = plan.shots.map((shot) => shot.id);
  const named = chapters.flatMap((chapter) => chapter.shotIds);
  const unknown = named.find((shotId) => !planShotIds.includes(shotId));
  if (unknown !== undefined) {
    return {
      kind: "not-found",
      file: bibleFile,
      message: `A chapter names the shot "${unknown}", which the story plan does not have.`,
    };
  }
  const twice = repeatedOf(named);
  if (twice !== undefined) {
    return {
      kind: "shot-in-two-chapters",
      file: bibleFile,
      message: `The shot "${twice}" is in two chapters. Each shot is in exactly one chapter.`,
    };
  }
  const missing = planShotIds.filter((shotId) => !named.includes(shotId));
  if (missing.length > 0) {
    return {
      kind: "chapter-misses-shot",
      file: bibleFile,
      message: `No chapter has the shots ${missing.map((shotId) => `"${shotId}"`).join(", ")}. Each shot is in exactly one chapter.`,
    };
  }
  const brokenAt = named.findIndex(
    (...[shotId, index]) => shotId !== planShotIds[index],
  );
  if (brokenAt !== -1) {
    return {
      kind: "chapters-break-order",
      file: bibleFile,
      message: `The chapters put the shot "${named[brokenAt] ?? ""}" where the plan has "${planShotIds[brokenAt] ?? ""}". The chapters keep the order of the shots.`,
    };
  }
  return undefined;
}
