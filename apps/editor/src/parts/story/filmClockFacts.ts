import { z } from "zod";

const filmStages = [
  "story",
  "plan",
  "sheets",
  "start-pictures",
  "clips",
  "music",
  "edit",
  "render",
] as const;

type FilmStage = (typeof filmStages)[number];

const filmStageNames: Record<FilmStage, string> = {
  story: "Story",
  plan: "Plan",
  sheets: "Characters and places",
  "start-pictures": "First pictures",
  clips: "Clips",
  music: "Music",
  edit: "Edit",
  render: "Export",
};

const stageTimesSchema = z.object({
  startedAt: z.string(),
  endedAt: z.string(),
});

export const clockAnswerSchema = z.object({
  clock: z.object({
    targetMinutes: z.number(),
    stages: z.partialRecord(z.enum(filmStages), stageTimesSchema),
  }),
});

export type ClockAnswer = z.infer<typeof clockAnswerSchema>;

export interface ClockFacts {
  targetText: string;
  usedText: string;
  leftText: string;
  isOver: boolean;
  usedShare: number;
  stages: { name: string; text: string; share: number }[];
}

export function durationText(milliseconds: number): string {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${String(rest)} s`;
  return rest === 0
    ? `${String(minutes)} min`
    : `${String(minutes)} min ${String(rest)} s`;
}

export function clockFactsOf(answer: ClockAnswer): ClockFacts | undefined {
  const { targetMinutes, stages } = answer.clock;
  const entries = filmStages.flatMap((stage) => {
    const times = stages[stage];
    if (times === undefined) return [];
    return [
      {
        name: filmStageNames[stage],
        startedAt: Date.parse(times.startedAt),
        endedAt: Date.parse(times.endedAt),
      },
    ];
  });
  if (entries.length === 0) return undefined;
  const startedAt = Math.min(...entries.map((entry) => entry.startedAt));
  const endedAt = Math.max(...entries.map((entry) => entry.endedAt));
  const target = targetMinutes * 60_000;
  const used = endedAt - startedAt;
  return {
    targetText: `${String(targetMinutes)} min`,
    usedText: durationText(used),
    leftText: durationText(Math.abs(target - used)),
    isOver: used > target,
    usedShare: Math.min(1, used / target),
    stages: entries.map((entry) => ({
      name: entry.name,
      text: durationText(entry.endedAt - entry.startedAt),
      share: Math.min(1, (entry.endedAt - entry.startedAt) / target),
    })),
  };
}
