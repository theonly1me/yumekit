import type { CriticAnswer } from "./criticFixture.js";

function linesBetween(options: {
  brief: string;
  from: string;
  to: string;
}): string[] {
  const lines = options.brief.split("\n");
  const start = lines.findIndex((line) => line.startsWith(options.from));
  const end = lines.findIndex((line) => line.startsWith(options.to));
  return lines.slice(start + 1, end);
}

export function planShotIdsOf(brief: string): string[] {
  return brief
    .split("\n")
    .flatMap((line) => /^Shot \d+ "([^"]+)"/.exec(line)?.slice(1, 2) ?? []);
}

export function planCastIdsOf(brief: string): string[] {
  return brief
    .split("\n")
    .flatMap(
      (line) =>
        /^- ([a-z0-9-]+) \((person|place|product|prop)\)/
          .exec(line)
          ?.slice(1, 2) ?? [],
    );
}

export function planFindingCountOf(brief: string): number {
  return linesBetween({
    brief,
    from: "The findings of the word test",
    to: "The list",
  }).filter((line) => /^\d+\. /.test(line)).length;
}

export function planAnswerOf(brief: string): CriticAnswer {
  return planAnswerWith({ brief });
}

export function planAnswerWith(options: {
  brief: string;
  verdict?: "pass" | "fail";
  shotFaults?: Record<string, string[]>;
  findingCause?: "fault" | "harmless";
  easiest?: string;
  hardest?: string;
}): CriticAnswer {
  const { brief } = options;
  const shotIds = planShotIdsOf(brief);
  const easiest = options.easiest ?? shotIds[0] ?? "";
  const hardest = options.hardest ?? shotIds.at(-1) ?? "";
  return {
    checks: Array.from({ length: 8 }, (...[, index]) => ({
      item: index + 1,
      seen: "It holds.",
    })),
    findings: Array.from(
      { length: planFindingCountOf(brief) },
      (...[, index]) => ({
        index: index + 1,
        cause: options.findingCause ?? "harmless",
        seen: "A size a picture can show.",
      }),
    ),
    shots: shotIds.map((shotId) => ({
      shot_id: shotId,
      difficulty: shotId === easiest ? 1 : shotId === hardest ? 5 : 3,
      limits: [],
      faults: options.shotFaults?.[shotId] ?? [],
      notes: [],
    })),
    cast: planCastIdsOf(brief).map((castId) => ({
      cast_id: castId,
      faults: [],
      notes: [],
    })),
    faults: [],
    notes: [],
    verdict: options.verdict ?? "pass",
    easiest_shot_id: easiest,
    hardest_shot_id: hardest,
  };
}
