import type { ClockRecord } from "./filmClock.js";
import { filmStages, stageNames } from "./filmStages.js";

export function durationText(milliseconds: number): string {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes === 0
    ? `${String(rest)} s`
    : `${String(minutes)} min ${String(rest).padStart(2, "0")} s`;
}

export function clockSpanOf(
  record: ClockRecord,
): { startedAt: number; endedAt: number } | undefined {
  const times = Object.values(record.stages);
  if (times.length === 0) return undefined;
  return {
    startedAt: Math.min(...times.map((entry) => Date.parse(entry.startedAt))),
    endedAt: Math.max(...times.map((entry) => Date.parse(entry.endedAt))),
  };
}

export function clockLines(record: ClockRecord): string[] {
  const span = clockSpanOf(record);
  const targetText = `${String(record.targetMinutes)} minutes`;
  if (span === undefined) {
    return [
      "### The clock",
      `Target: ${targetText} for the film. No stage has started. The clock is information: nothing stops when the time passes.`,
    ];
  }
  const used = span.endedAt - span.startedAt;
  const left = record.targetMinutes * 60_000 - used;
  const stages = filmStages.flatMap((stage) => {
    const times = record.stages[stage];
    return times === undefined
      ? []
      : [
          `${stageNames[stage]} ${durationText(Date.parse(times.endedAt) - Date.parse(times.startedAt))}`,
        ];
  });
  return [
    "### The clock",
    `Target: ${targetText}. Time so far: ${durationText(used)}, from the first call to the last. ${left >= 0 ? `Time left: ${durationText(left)}.` : `Over the target by ${durationText(-left)}.`} The clock is information: nothing stops when the time passes.`,
    `Stages: ${stages.join("; ")}. Give these times in your final answer.`,
  ];
}
