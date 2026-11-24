import { endEntryNamesOf } from "../../storyPlan/stateText.js";
import type { ClipAnswer } from "./clipAnswerInput.js";
import type { ClipJob } from "./clipJob.js";
import { clipListItems } from "./clipList.js";

type Issue = string | undefined;

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

function isInside(options: {
  seconds?: number | undefined;
  from: number;
  to: number;
}): boolean {
  const { seconds } = options;
  return (
    seconds === undefined || (seconds >= options.from && seconds <= options.to)
  );
}

function cutIssues(options: { job: ClipJob; answer: ClipAnswer }): Issue[] {
  const { job, answer } = options;
  const from = answer.keep_from_seconds;
  const to = answer.keep_to_seconds;
  if (from === undefined || to === undefined || from >= to) {
    return ["A cut needs keep_from_seconds before keep_to_seconds."];
  }
  if (to > job.lengthSeconds + 0.05) {
    return [`The clip ends at ${String(job.lengthSeconds)} seconds.`];
  }
  const range = { from, to };
  const happenedIssue = (judged: {
    name: string;
    happened: boolean;
    seconds?: number | undefined;
  }): Issue =>
    judged.happened && isInside({ ...range, seconds: judged.seconds })
      ? undefined
      : `The ${judged.name} must happen inside the cut, or the clip is a redo.`;
  return [
    answer.faults.length === 0
      ? "A cut names the faults outside the clean part."
      : undefined,
    happenedIssue({ name: "action", ...answer.action }),
    ...answer.end_entries.map((entry) =>
      happenedIssue({ name: `end entry "${entry.entry}"`, ...entry }),
    ),
    ...answer.warnings.map((entry) => {
      const seconds = job.warnings[entry.index - 1]?.seconds;
      return entry.cause === "fault" && isInside({ ...range, seconds })
        ? `Warning ${String(entry.index)} is a fault inside the cut.`
        : undefined;
    }),
    ...answer.counts.map((count) =>
      count.seen !== count.expected && isInside({ ...range, ...count })
        ? `The count of ${count.object} differs inside the cut.`
        : undefined,
    ),
  ];
}

export function clipAnswerIssuesOf(options: {
  job: ClipJob;
  answer: ClipAnswer;
}): string[] {
  const { answer } = options;
  const verdictIssues =
    answer.verdict === "keep"
      ? keepIssues(answer)
      : answer.verdict === "cut"
        ? cutIssues(options)
        : [answer.faults.length === 0 ? "A redo names its faults." : undefined];
  const startsElsewhere =
    answer.verdict !== "redo" &&
    options.job.startPicture !== undefined &&
    options.job.warnings.some(
      (warning) => warning.kind === "does-not-start-on-the-start-picture",
    )
      ? "The measure shows that the first frame is another picture than the start picture, so the clip is a redo."
      : undefined;
  return [
    ...wholenessIssues(options),
    ...verdictIssues,
    startsElsewhere,
  ].flatMap((issue) => (issue === undefined ? [] : [issue]));
}
