import type { ClipReview, CriticRecord } from "@yumekit/project";
import type { ClipAnswer } from "./clipAnswerInput.js";
import type { ClipJob } from "./clipJob.js";

function at(seconds: number | undefined): string {
  return seconds === undefined
    ? ""
    : ` at ${String(Math.round(seconds * 100) / 100)}s`;
}

export function missedOf(answer: ClipAnswer): string[] {
  return [
    ...(answer.action.happened
      ? []
      : [`The action did not happen: ${answer.action.seen}`]),
    ...answer.end_entries.flatMap((entry) =>
      entry.happened
        ? []
        : [
            entry.entry === "end state"
              ? `The end state did not happen: ${entry.seen}`
              : `The end of ${entry.entry} did not happen: ${entry.seen}`,
          ],
    ),
  ];
}

export function criticRecordOf(options: {
  job: ClipJob;
  answer: ClipAnswer;
  seconds: number;
}): CriticRecord {
  const { job, answer } = options;
  return {
    answers: answer.checks.map((check) => ({
      item: check.item,
      seen: check.seen,
    })),
    counts: answer.counts.map((count) => ({
      object: count.object,
      expected: count.expected,
      seen: count.seen,
      ...(count.seconds === undefined ? {} : { seconds: count.seconds }),
    })),
    missed: missedOf(answer),
    warnings: answer.warnings.map((entry) => {
      const warning = job.warnings[entry.index - 1];
      return {
        kind: warning?.kind ?? "warning",
        ...(warning?.seconds === undefined ? {} : { seconds: warning.seconds }),
        cause: entry.cause,
        seen: entry.seen,
      };
    }),
    seconds: Math.round(options.seconds),
  };
}

export function reviewOfAnswer(options: {
  job: ClipJob;
  answer: ClipAnswer;
  measures: ClipReview["measures"];
  endPictureAssetId: string | undefined;
  seconds: number;
}): ClipReview {
  const { answer } = options;
  const countFaults = answer.counts.flatMap((count) =>
    count.seen === count.expected
      ? []
      : [
          `${String(count.seen)} ${count.object}, not ${String(count.expected)}${at(count.seconds)}`,
        ],
  );
  const isCut = answer.verdict === "cut";
  return {
    assetId: options.job.clip.id,
    verdict: answer.verdict,
    by: "critic",
    faults: [...new Set([...answer.faults, ...countFaults])],
    ...(isCut && answer.keep_from_seconds !== undefined
      ? { keepFromSeconds: answer.keep_from_seconds }
      : {}),
    ...(isCut && answer.keep_to_seconds !== undefined
      ? { keepToSeconds: answer.keep_to_seconds }
      : {}),
    ...(options.endPictureAssetId === undefined
      ? {}
      : { endPictureAssetId: options.endPictureAssetId }),
    measures: options.measures,
    critic: criticRecordOf(options),
    ...(answer.notes.length === 0 ? {} : { notes: answer.notes }),
  };
}
