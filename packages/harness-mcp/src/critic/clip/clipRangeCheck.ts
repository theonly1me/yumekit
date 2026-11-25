import { shortestCleanSeconds } from "../../storyPlan/designGate.js";
import { cleanRangeOf, rangeText, type CleanRange } from "./cleanRange.js";
import type { ClipAnswer } from "./clipAnswerInput.js";
import type { ClipJob } from "./clipJob.js";

export type Issue = string | undefined;

interface Judged {
  job: ClipJob;
  answer: ClipAnswer;
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

function rangeIssues(options: {
  answer: ClipAnswer;
  range: CleanRange;
}): Issue[] {
  const { answer, range } = options;
  const happenedIssue = (judged: {
    name: string;
    happened: boolean;
    seconds?: number | undefined;
  }): Issue =>
    judged.happened && isInside({ ...range, seconds: judged.seconds })
      ? undefined
      : `The ${judged.name} must happen inside the clean part ${rangeText(range)}, or the clip is a redo.`;
  return [
    happenedIssue({ name: "action", ...answer.action }),
    ...answer.end_entries.map((entry) =>
      happenedIssue({ name: `end entry "${entry.entry}"`, ...entry }),
    ),
  ];
}

export function cleanRangeOfAnswer(options: Judged): CleanRange {
  return cleanRangeOf({
    faults: options.answer.faults,
    lengthSeconds: options.job.lengthSeconds,
  });
}

export function faultTimeIssues(options: Judged): Issue[] {
  const end = options.job.lengthSeconds + 0.05;
  return options.answer.faults.map((fault) =>
    fault.from_seconds <= fault.to_seconds && fault.to_seconds <= end
      ? undefined
      : `The fault "${fault.fault}" needs from_seconds at or before to_seconds, inside the ${String(options.job.lengthSeconds)} seconds of the clip.`,
  );
}

export function redoIssues(options: Judged): Issue[] {
  const { answer } = options;
  if (answer.faults.length === 0) return ["A redo names its faults."];
  const range = cleanRangeOfAnswer(options);
  const isUsable =
    range.to - range.from >= shortestCleanSeconds &&
    rangeIssues({ answer, range }).every((issue) => issue === undefined) &&
    answer.warnings.every((entry) => entry.cause !== "fault");
  return isUsable
    ? [
        `The faults leave a clean part from ${rangeText(range)} that holds the action. That is a cut: give the verdict cut.`,
      ]
    : [];
}

export function cutIssues(options: Judged): Issue[] {
  const { job, answer } = options;
  if (answer.faults.length === 0) {
    return [
      "A cut names the faults outside the clean part, with their seconds.",
    ];
  }
  const range = cleanRangeOfAnswer(options);
  if (range.to - range.from < shortestCleanSeconds) {
    return [
      `The longest part with no fault is ${rangeText(range)}, under ${String(shortestCleanSeconds)} seconds. That is a redo.`,
    ];
  }
  return [
    ...rangeIssues({ answer, range }),
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
