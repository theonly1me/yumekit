import type { DesignCheck, DesignChecker, Shot } from "@yumekit/project";
import { cleanSpanOf, type DesignFrameAnswer } from "./designAnswer.js";
import type { DesignJob } from "./designJob.js";

function rounded(seconds: number): string {
  return String(Math.round(seconds * 100) / 100);
}

function breaksOf(options: {
  job: DesignJob;
  frames: DesignFrameAnswer[];
}): string[] {
  return options.frames.flatMap((frame) => {
    const entry = options.job.members.find(
      (member) => member.member.id === frame.cast_id,
    );
    if (entry === undefined) return [];
    const at =
      frame.seconds === undefined ? "" : ` at ${rounded(frame.seconds)}s`;
    return frame.answers.flatMap((answer) => {
      if (answer.answer !== "no") return [];
      const question = (entry.questions[answer.question - 1]?.text ?? "")
        .trim()
        .replace(/\.$/, "");
      return [`${entry.member.name}${at}: ${question}. Seen: ${answer.seen}`];
    });
  });
}

function checkOf(options: {
  job: DesignJob;
  frames: DesignFrameAnswer[];
  assetId: string;
  by: DesignChecker;
}): DesignCheck {
  const { job } = options;
  const frames = [...options.frames].sort(
    (...[first, second]) => (first.seconds ?? 0) - (second.seconds ?? 0),
  );
  const breaks = [...new Set(breaksOf({ job, frames }))];
  const { lastClean } = cleanSpanOf(frames);
  return {
    assetId: options.assetId,
    by: options.by,
    frames: frames.flatMap((frame) => {
      const entry = job.members.find(
        (member) => member.member.id === frame.cast_id,
      );
      if (entry === undefined) return [];
      return [
        {
          castId: frame.cast_id,
          lookId: entry.look.id,
          ...(frame.seconds === undefined ? {} : { seconds: frame.seconds }),
          answers: frame.answers.map((answer) => ({
            question: entry.questions[answer.question - 1]?.text ?? "",
            answer: answer.answer,
            seen: answer.seen,
          })),
        },
      ];
    }),
    breaks,
    ...(job.target.kind === "clip" && breaks.length > 0
      ? { cleanUntilSeconds: lastClean ?? 0 }
      : {}),
  };
}

export function designChecksOf(options: {
  job: DesignJob;
  frames: DesignFrameAnswer[];
  by: DesignChecker;
}): DesignCheck[] {
  const { job, frames, by } = options;
  const { target } = job;
  if (target.kind === "clip") {
    return [checkOf({ job, frames, assetId: target.clip.id, by })];
  }
  return target.pictures.map((picture) =>
    checkOf({
      job,
      frames: frames.filter((frame) => frame.asset_id === picture.id),
      assetId: picture.id,
      by,
    }),
  );
}

export function withDesignChecks(options: {
  shot: Shot;
  checks: DesignCheck[];
}): Shot {
  const { shot, checks } = options;
  const kept = (shot.designChecks ?? []).filter(
    (existing) => !checks.some((check) => check.assetId === existing.assetId),
  );
  return checks.length === 0
    ? shot
    : { ...shot, designChecks: [...kept, ...checks] };
}

export function designCheckOf(options: {
  shot: Shot;
  assetId: string;
}): DesignCheck | undefined {
  return (options.shot.designChecks ?? []).find(
    (check) => check.assetId === options.assetId,
  );
}

export function designLineOf(checks: DesignCheck[]): string {
  const broken = checks.filter((check) => check.breaks.length > 0);
  if (checks.length === 0) return "";
  if (broken.length === 0)
    return " Design check: the same design in every frame.";
  return ` Design check: ${broken
    .map(
      (check) =>
        `"${check.assetId}" breaks the design${check.cleanUntilSeconds === undefined ? "" : `, clean until ${rounded(check.cleanUntilSeconds)}s`}: ${check.breaks.join("; ")}`,
    )
    .join(". ")}.`;
}
