import { setTimeout as delay } from "node:timers/promises";
import type { JsonObject } from "@yumekit/tools";
import { clipListItems } from "../critic/clip/clipList.js";
import type { AskCritic } from "../critic/criticTypes.js";
import { reviewJobMetaKey } from "../createHarnessServer.js";
import { planAnswerOf } from "./planCritic.js";

export type CriticAnswer = JsonObject;

export interface CriticScript {
  clip?: (brief: string) => CriticAnswer;
  sheet?: (brief: string) => CriticAnswer;
  plan?: (brief: string) => CriticAnswer;
  start?: (brief: string) => CriticAnswer;
  waitMilliseconds?: number;
}

export interface CriticLog {
  briefs: string[];
  answers: { isError: boolean; text: string }[];
  mostAtOnce: number;
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
    checks: Array.from({ length: clipListItems.length }, (...[, index]) => ({
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
    checks: Array.from({ length: 8 }, (...[, index]) => ({
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
  _meta: Record<string, string>;
}) => Promise<{ isError: boolean; text: string }>;

export function scriptedCritic(options: {
  call: CriticToolCall;
  script: CriticScript;
  log: CriticLog;
}): AskCritic {
  let running = 0;
  return async (request) => {
    const { log, script } = options;
    running += 1;
    log.mostAtOnce = Math.max(log.mostAtOnce, running);
    await delay(script.waitMilliseconds ?? 0);
    log.briefs.push(request.brief);
    const meta = { [reviewJobMetaKey]: request.jobId };
    await options.call({
      name: "view_for_review",
      arguments: {},
      _meta: meta,
    });
    const kind =
      (["sheet", "plan", "start"] as const).find((candidate) =>
        request.brief.startsWith(`Review job: the ${candidate}`),
      ) ?? "clip";
    const answer = {
      sheet: script.sheet ?? passSheetAnswerOf,
      plan: script.plan ?? planAnswerOf,
      start: script.start ?? passSheetAnswerOf,
      clip: script.clip ?? keepAnswerOf,
    }[kind](request.brief);
    log.answers.push(
      await options.call({
        name: `give_${kind}_review`,
        arguments: answer,
        _meta: meta,
      }),
    );
    running -= 1;
    return { ok: true, seconds: 1 };
  };
}
