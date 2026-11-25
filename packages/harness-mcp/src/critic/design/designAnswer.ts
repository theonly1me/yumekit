import { designAnswers } from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../../inputs.js";
import {
  designBracketSeconds,
  designFrameSeconds,
  framesOf,
  type DesignJob,
} from "./designJob.js";

export const designFrameInput = z.strictObject({
  cast_id: idInput("The person of the design check."),
  asset_id: idInput("The picture of this answer.")
    .optional()
    .describe("The picture of this answer, for a picture or a sheet."),
  seconds: z
    .number()
    .min(0)
    .optional()
    .describe("The time of the frame, for a clip."),
  answers: z
    .array(
      z.strictObject({
        question: z.int().min(1).describe("The number of the question."),
        answer: z.enum(designAnswers),
        seen: z
          .string()
          .trim()
          .min(1)
          .describe("What you saw in the crop, in plain words."),
      }),
    )
    .describe("One answer for each question of this person."),
});

export const designInput = z
  .array(designFrameInput)
  .default([])
  .describe(
    "The design check: one entry for each person and each frame that the brief names, and more frames of a clip where you narrow down a break. Empty when the brief has no design check.",
  );

export type DesignFrameAnswer = z.infer<typeof designFrameInput>;

const tolerance = designFrameSeconds + 0.01;

export function isBroken(frame: DesignFrameAnswer): boolean {
  return frame.answers.some((answer) => answer.answer === "no");
}

export function cleanSpanOf(frames: DesignFrameAnswer[]): {
  firstBreak: number | undefined;
  lastClean: number | undefined;
} {
  const times = [
    ...new Set(frames.flatMap((frame) => frame.seconds ?? [])),
  ].sort((...[first, second]) => first - second);
  const broken = times.filter((time) =>
    frames.some((frame) => frame.seconds === time && isBroken(frame)),
  );
  const [firstBreak] = broken;
  const lastClean = times
    .filter(
      (time) =>
        !broken.includes(time) &&
        (firstBreak === undefined || time < firstBreak),
    )
    .at(-1);
  return { firstBreak, lastClean };
}

function entryIssuesOf(options: {
  job: DesignJob;
  frame: DesignFrameAnswer;
}): string[] {
  const { job, frame } = options;
  const entry = job.members.find(
    (member) => member.member.id === frame.cast_id,
  );
  if (entry === undefined) {
    return [`"${frame.cast_id}" is not a person of the design check.`];
  }
  const where =
    frame.asset_id ??
    (frame.seconds === undefined ? "" : `${String(frame.seconds)}s`);
  const numbers = frame.answers.map((answer) => answer.question);
  const missing = entry.questions.flatMap((...[, index]) =>
    numbers.includes(index + 1) ? [] : [index + 1],
  );
  const extra = numbers.filter(
    (...[number, index]) =>
      number > entry.questions.length || numbers.indexOf(number) !== index,
  );
  return [
    ...(missing.length === 0
      ? []
      : [
          `Answer questions ${missing.join(", ")} of "${frame.cast_id}" at ${where}.`,
        ]),
    ...(extra.length === 0
      ? []
      : [
          `"${frame.cast_id}" at ${where} has ${String(entry.questions.length)} questions; answer each once.`,
        ]),
  ];
}

function coverageIssuesOf(options: {
  job: DesignJob;
  frames: DesignFrameAnswer[];
}): string[] {
  const { job, frames } = options;
  return job.members.flatMap((entry) =>
    framesOf(job).flatMap((wanted) => {
      const found = frames.some(
        (frame) =>
          frame.cast_id === entry.member.id &&
          (wanted.assetId === undefined
            ? frame.seconds !== undefined &&
              Math.abs(frame.seconds - (wanted.seconds ?? 0)) <= tolerance
            : frame.asset_id === wanted.assetId),
      );
      return found
        ? []
        : [
            `Give the design answers of "${entry.member.id}" at ${wanted.label}.`,
          ];
    }),
  );
}

function isSeen(options: {
  job: DesignJob;
  frame: DesignFrameAnswer;
}): boolean {
  const { job, frame } = options;
  return job.seen.some(
    (crop) =>
      crop.castId === frame.cast_id &&
      (job.target.kind === "clip"
        ? Math.abs((crop.seconds ?? 0) - (frame.seconds ?? 0)) <=
          designFrameSeconds / 2 + 0.01
        : crop.assetId === frame.asset_id),
  );
}

function unseenIssuesOf(options: {
  job: DesignJob;
  frames: DesignFrameAnswer[];
}): string[] {
  const { job } = options;
  return options.frames.flatMap((frame) => {
    if (isSeen({ job, frame })) return [];
    const where =
      job.target.kind === "clip"
        ? `seconds ${String(frame.seconds ?? 0)}`
        : `asset_id "${frame.asset_id ?? ""}"`;
    return [
      `You answered "${frame.cast_id}" at ${where} without its enlarged crop. Look at it first: cast_id "${frame.cast_id}", ${where}, and the region of the whole person.`,
    ];
  });
}

function bracketIssuesOf(frames: DesignFrameAnswer[]): string[] {
  const { firstBreak, lastClean } = cleanSpanOf(frames);
  if (firstBreak === undefined || firstBreak <= tolerance) return [];
  if (
    lastClean !== undefined &&
    firstBreak - lastClean <= designBracketSeconds + 0.01
  ) {
    return [];
  }
  return [
    `The first break is at ${String(firstBreak)}s and the last clean frame before it is at ${lastClean === undefined ? "none" : `${String(lastClean)}s`}. Check frames between them until the two are at most ${String(designBracketSeconds)} seconds apart.`,
  ];
}

export function designIssuesOf(options: {
  job: DesignJob | undefined;
  frames: DesignFrameAnswer[];
}): string[] {
  const { job, frames } = options;
  if (job === undefined) return [];
  return [
    ...frames.flatMap((frame) => entryIssuesOf({ job, frame })),
    ...coverageIssuesOf({ job, frames }),
    ...unseenIssuesOf({ job, frames }),
    ...(job.target.kind === "clip" ? bracketIssuesOf(frames) : []),
  ];
}
