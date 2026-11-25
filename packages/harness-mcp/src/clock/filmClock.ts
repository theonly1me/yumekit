import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { filmStages, type FilmStage } from "./filmStages.js";

export const defaultTargetMinutes = 10;

const stageTimesSchema = z.strictObject({
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
});

const clockRecordSchema = z.strictObject({
  targetMinutes: z.number().positive(),
  stages: z.partialRecord(z.enum(filmStages), stageTimesSchema),
});

export type StageTimes = z.infer<typeof stageTimesSchema>;
export type ClockRecord = z.infer<typeof clockRecordSchema>;

export interface FilmClock {
  mark: (options: { stage: FilmStage; at: Date }) => Promise<void>;
  read: () => Promise<ClockRecord>;
}

const emptyClock: ClockRecord = {
  targetMinutes: defaultTargetMinutes,
  stages: {},
};

export function clockFileOf(projectFolder: string): string {
  return join(projectFolder, ".yumekit", "clock.json");
}

function jsonOf(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function readClockFile(file: string): Promise<ClockRecord> {
  const text = await readFile(file, "utf8").catch(() => undefined);
  if (text === undefined) return emptyClock;
  const parsed = clockRecordSchema.safeParse(jsonOf(text));
  return parsed.success ? parsed.data : emptyClock;
}

async function writeClockFile(options: {
  file: string;
  record: ClockRecord;
}): Promise<void> {
  const { file } = options;
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temporary, `${JSON.stringify(options.record, null, 2)}\n`);
  await rename(temporary, file);
}

function marked(options: {
  record: ClockRecord;
  stage: FilmStage;
  at: Date;
}): ClockRecord {
  const { record, stage } = options;
  const at = options.at.toISOString();
  const times = record.stages[stage];
  return {
    ...record,
    stages: {
      ...record.stages,
      [stage]: {
        startedAt:
          times === undefined || at < times.startedAt ? at : times.startedAt,
        endedAt: times === undefined || at > times.endedAt ? at : times.endedAt,
      },
    },
  };
}

export function createFilmClock(projectFolder: string): FilmClock {
  const file = clockFileOf(projectFolder);
  let writes: Promise<ClockRecord> = readClockFile(file);
  return {
    mark: async ({ stage, at }) => {
      writes = writes.then(async (record) => {
        const next = marked({ record, stage, at });
        await writeClockFile({ file, record: next }).catch(() => undefined);
        return next;
      });
      await writes;
    },
    read: () => writes,
  };
}
