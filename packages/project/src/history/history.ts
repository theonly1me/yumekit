import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { folderSource } from "../folder/fileSources.js";
import type { ProjectFiles } from "../folder/projectFiles.js";
import { readJsonFile, type InvalidFile } from "../folder/readJsonFile.js";
import { stableJson } from "../folder/stableJson.js";
import { writeFileAtomic } from "../folder/writeFileAtomic.js";
import { succeed, type Outcome } from "../outcome.js";

export const stepsKept = 200;

const historyIndexFile = ".yumekit/history/index.json";

const historySchema = z.strictObject({
  revision: z.int().min(0),
  undoSteps: z.array(z.uuid()),
  redoSteps: z.array(z.uuid()),
});

const stepSchema = z.strictObject({
  files: z.record(z.string(), z.string()),
});

export type History = z.infer<typeof historySchema>;

function stepFile(stepId: string): string {
  return `.yumekit/history/steps/${stepId}.json`;
}

export const emptyHistory: History = {
  revision: 0,
  undoSteps: [],
  redoSteps: [],
};

export async function loadHistory(
  folder: string,
): Promise<Outcome<History, InvalidFile>> {
  const source = folderSource(folder);
  if ((await source.read(historyIndexFile)) === undefined) {
    return succeed(emptyHistory);
  }
  return readJsonFile({
    source,
    file: historyIndexFile,
    schema: historySchema,
  });
}

export async function saveHistory(options: {
  folder: string;
  history: History;
}): Promise<void> {
  await writeFileAtomic({
    path: join(options.folder, historyIndexFile),
    content: stableJson(options.history),
  });
}

export async function saveStep(options: {
  folder: string;
  files: ProjectFiles;
}): Promise<string> {
  const stepId = randomUUID();
  await writeFileAtomic({
    path: join(options.folder, stepFile(stepId)),
    content: stableJson({ files: Object.fromEntries(options.files) }),
  });
  return stepId;
}

export async function readStep(options: {
  folder: string;
  stepId: string;
}): Promise<ProjectFiles> {
  const file = stepFile(options.stepId);
  const text = await readFile(join(options.folder, file), "utf8");
  const step = stepSchema.parse(JSON.parse(text));
  return new Map(Object.entries(step.files));
}

export async function deleteSteps(options: {
  folder: string;
  stepIds: string[];
}): Promise<void> {
  for (const stepId of options.stepIds) {
    await rm(join(options.folder, stepFile(stepId)), { force: true });
  }
}
