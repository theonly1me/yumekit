import type { JsonObject } from "@yumekit/tools";
import type { AskCritic } from "../critic/criticTypes.js";

export type CriticAnswer = JsonObject;

export interface CriticScript {
  clip?: (brief: string) => CriticAnswer;
  sheet?: (brief: string) => CriticAnswer;
}

export interface CriticLog {
  briefs: string[];
  answers: { isError: boolean; text: string }[];
}

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

export function warningCountOf(brief: string): number {
  return linesBetween({
    brief,
    from: "The measured warnings",
    to: "The list",
  }).filter((line) => /^\d+\. [a-z-]+/.test(line)).length;
}

export function endEntriesOf(brief: string): string[] {
  const line = brief
    .split("\n")
    .find((candidate) => candidate.startsWith("- End entries to judge: "));
  return (line ?? "").replace("- End entries to judge: ", "").split(", ");
}

export function keepAnswerOf(brief: string): CriticAnswer {
  return {
    checks: Array.from({ length: 10 }, (...[, index]) => ({
      item: index + 1,
      seen: "It holds on each frame.",
    })),
    counts: [{ object: "hammers", expected: 1, seen: 1 }],
    action: { happened: true, seconds: 0.5, seen: "The hammer lands." },
    end_entries: endEntriesOf(brief).map((entry) => ({
      entry,
      happened: true,
      seconds: 0.9,
      seen: "As planned.",
    })),
    start_match: { matches: true, seen: "The same framing." },
    ...(brief.includes("the end of the shot before")
      ? { cut_match: { matches: true, seen: "The same side." } }
      : {}),
    warnings: Array.from({ length: warningCountOf(brief) }, (...[, index]) => ({
      index: index + 1,
      cause: "harmless",
      seen: "A drawn flash of light.",
    })),
    verdict: "keep",
    faults: [],
  };
}

export function passSheetAnswerOf(): CriticAnswer {
  return {
    checks: Array.from({ length: 6 }, (...[, index]) => ({
      item: index + 1,
      seen: "It holds.",
    })),
    counts: [],
    verdict: "pass",
    faults: [],
  };
}

export type CriticToolCall = (request: {
  name: string;
  arguments: CriticAnswer;
}) => Promise<{ isError: boolean; text: string }>;

export function scriptedCritic(options: {
  call: CriticToolCall;
  script: CriticScript;
  log: CriticLog;
}): AskCritic {
  return async (request) => {
    const { log, script } = options;
    log.briefs.push(request.brief);
    await options.call({ name: "view_for_review", arguments: {} });
    const isSheet = request.brief.startsWith("Review job: the sheet");
    const answer = isSheet
      ? (script.sheet ?? passSheetAnswerOf)(request.brief)
      : (script.clip ?? keepAnswerOf)(request.brief);
    log.answers.push(
      await options.call({
        name: isSheet ? "give_sheet_review" : "give_clip_review",
        arguments: answer,
      }),
    );
    return { ok: true, seconds: 1 };
  };
}
