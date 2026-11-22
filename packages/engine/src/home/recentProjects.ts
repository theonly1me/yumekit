import { realpath, stat } from "node:fs/promises";
import { join } from "node:path";
import { configurationDirectory } from "@yumekit/tools";
import { z } from "zod";
import { readOptionalFile, writeFileAtomic } from "../agents/agentFiles.js";
import type { Outcome } from "../engineTypes.js";
import {
  projectLengthSchema,
  type ProjectLength,
  type RecentProject,
} from "./homeTypes.js";
import { readProjectFacts } from "./projectFacts.js";

const mostRecentProjects = 20;

const recentEntrySchema = z.object({
  folder: z.string(),
  length: projectLengthSchema.nullable(),
  openedAt: z.iso.datetime(),
});

const recentFileSchema = z.object({ projects: z.array(recentEntrySchema) });

type RecentEntry = z.infer<typeof recentEntrySchema>;

const changeFiles = [
  "project.json",
  "script.md",
  "bible.json",
  "assets/index.json",
  "scenes",
  "timelines",
];

let writing: Promise<unknown> = Promise.resolve();

export function recentFilePath(): string {
  return join(configurationDirectory(), "recent.json");
}

function entriesOf(text: string | undefined): RecentEntry[] {
  if (text === undefined) return [];
  try {
    const parsed = recentFileSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.projects : [];
  } catch {
    return [];
  }
}

async function readEntries(): Promise<RecentEntry[]> {
  const read = await readOptionalFile(recentFilePath());
  return read.ok ? entriesOf(read.value) : [];
}

async function changeTimeOf(options: {
  folder: string;
  openedAt: string;
}): Promise<string> {
  const times = await Promise.all(
    changeFiles.map((file) =>
      stat(join(options.folder, file)).then(
        (facts) => facts.mtimeMs,
        () => 0,
      ),
    ),
  );
  const latest = Math.max(Date.parse(options.openedAt), ...times);
  return new Date(latest).toISOString();
}

async function recentProjectOf(
  entry: RecentEntry,
): Promise<RecentProject | undefined> {
  const facts = await readProjectFacts(entry.folder);
  if (facts === undefined) return undefined;
  return {
    folder: entry.folder,
    name: facts.name,
    platforms: facts.platforms,
    length: entry.length,
    changedAt: await changeTimeOf(entry),
  };
}

export async function listRecentProjects(): Promise<RecentProject[]> {
  const projects = await Promise.all(
    (await readEntries()).map(recentProjectOf),
  );
  return projects.filter((project) => project !== undefined);
}

export async function isRecentFolder(folder: string): Promise<boolean> {
  return (await readEntries()).some((entry) => entry.folder === folder);
}

async function writeRecent(options: {
  folder: string;
  length: ProjectLength | undefined;
}): Promise<Outcome<{ written: true }, string>> {
  const entries = await readEntries();
  const folder = await realpath(options.folder).catch(() => undefined);
  if (folder === undefined) {
    return { ok: false, failure: `The folder ${options.folder} is missing.` };
  }
  const earlier = entries.find((entry) => entry.folder === folder);
  const entry: RecentEntry = {
    folder,
    length: options.length ?? earlier?.length ?? null,
    openedAt: new Date().toISOString(),
  };
  const projects = [
    entry,
    ...entries.filter((candidate) => candidate.folder !== folder),
  ].slice(0, mostRecentProjects);
  return writeFileAtomic({
    file: recentFilePath(),
    content: `${JSON.stringify({ projects }, null, 2)}\n`,
  });
}

export function recordRecentProject(options: {
  folder: string;
  length?: ProjectLength;
}): Promise<Outcome<{ written: true }, string>> {
  const recorded = writing.then(() =>
    writeRecent({ folder: options.folder, length: options.length }),
  );
  writing = recorded.catch(() => undefined);
  return recorded;
}
