import { endEntryNamesOf } from "../../storyPlan/stateText.js";
import type { ClipAnswer } from "./clipAnswerInput.js";
import type { ClipJob } from "./clipJob.js";
import { clipListItems } from "./clipList.js";
import {
  cutIssues,
  faultTimeIssues,
  redoIssues,
  type Issue,
} from "./clipRangeCheck.js";

function wholenessIssues(options: {
  job: ClipJob;
  answer: ClipAnswer;
}): Issue[] {
  const { job, answer } = options;
  const answeredItems = new Set(answer.checks.map((check) => check.item));
  const answeredWarnings = new Set(answer.warnings.map((entry) => entry.index));
  const answeredEntries = new Set(
    answer.end_entries.map((entry) => entry.entry),
  );
  return [
    ...clipListItems.map((...[, index]) =>
      answeredItems.has(index + 1)
        ? undefined
        : `Answer item ${String(index + 1)} of the list in checks.`,
    ),
    ...job.warnings.map((...[warning, index]) =>
      answeredWarnings.has(index + 1)
        ? undefined
        : `Answer warning ${String(index + 1)} (${warning.kind}) in warnings: a fault, or the harmless cause on the frames.`,
    ),
    ...endEntryNamesOf(job.shot.endState).map((name) =>
      answeredEntries.has(name)
        ? undefined
        : `Judge the end entry "${name}" in end_entries.`,
    ),
    job.previousEnd !== undefined && answer.cut_match === undefined
      ? "Judge cut_match: the start against the end picture of the shot before."
      : undefined,
    ...answer.counts.map((count) =>
      count.seen !== count.expected && count.seconds === undefined
        ? `Give the time when the count of ${count.object} differs.`
        : undefined,
    ),
  ];
}

function keepIssues(answer: ClipAnswer): Issue[] {
  return [
    answer.faults.length > 0
      ? "A keep has no blocking faults. Move a difference that a viewer would not see to notes, or give cut with the clean part, or redo."
      : undefined,
    ...answer.warnings.map((entry) =>
      entry.cause === "fault"
        ? `Warning ${String(entry.index)} is a fault, so the clip is not a keep.`
        : undefined,
    ),
    ...answer.counts.map((count) =>
      count.seen === count.expected
        ? undefined
        : `The count of ${count.object} differs (${String(count.seen)}, not ${String(count.expected)}), so the clip is not a keep.`,
    ),
    answer.action.happened
      ? undefined
      : "The action did not happen, so the clip is not a keep.",
    ...answer.end_entries.map((entry) =>
      entry.happened
        ? undefined
        : `The end entry "${entry.entry}" did not happen, so the clip is not a keep.`,
    ),
    answer.start_match.matches
      ? undefined
      : "The first frame does not match the start picture, so the clip is not a keep.",
    answer.cut_match?.matches === false
      ? "The start does not match the shot before, so the clip is not a keep."
      : undefined,
  ];
}

export function clipAnswerIssuesOf(options: {
  job: ClipJob;
  answer: ClipAnswer;
}): string[] {
  const { answer } = options;
  const isElsewhere =
    options.job.startPicture !== undefined &&
    options.job.warnings.some(
      (warning) => warning.kind === "does-not-start-on-the-start-picture",
    );
  const verdictIssues =
    answer.verdict === "keep"
      ? keepIssues(answer)
      : answer.verdict === "cut"
        ? cutIssues(options)
        : isElsewhere
          ? []
          : redoIssues(options);
  const startsElsewhere =
    answer.verdict !== "redo" && isElsewhere
      ? "The measure shows that the first frame is another picture than the start picture, so the clip is a redo."
      : undefined;
  return [
    ...wholenessIssues(options),
    ...faultTimeIssues(options),
    ...verdictIssues,
    startsElsewhere,
  ].flatMap((issue) => (issue === undefined ? [] : [issue]));
}
