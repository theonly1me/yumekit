import { rm } from "node:fs/promises";
import { join } from "node:path";
import {
  takeDraftSchema,
  type ItemDraft,
  type TakeDraft,
} from "@yumekit/project";
import { readOptionalFile, writeFileAtomic } from "../agents/agentFiles.js";
import type { Outcome } from "../engineTypes.js";

export const storyDraftId = "story";

const emptyDraft: TakeDraft = { items: {} };

const turns = new Map<string, Promise<unknown>>();

export function takeDraftFileOf(options: {
  projectFolder: string;
  draftId: string;
}): string {
  return join(
    options.projectFolder,
    ".yumekit",
    "take-drafts",
    `${options.draftId}.json`,
  );
}

function inTurn<Result>(options: {
  file: string;
  work: () => Promise<Result>;
}): Promise<Result> {
  const before = turns.get(options.file) ?? Promise.resolve();
  const next = before.then(options.work, options.work);
  turns.set(options.file, next);
  return next;
}

function parsedDraftOf(text: string): TakeDraft {
  try {
    const parsed = takeDraftSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

async function readFileDraft(file: string): Promise<TakeDraft> {
  const read = await readOptionalFile(file);
  if (!read.ok || read.value === undefined) return emptyDraft;
  return parsedDraftOf(read.value);
}

export function readTakeDraft(options: {
  projectFolder: string;
  draftId: string;
}): Promise<TakeDraft> {
  const file = takeDraftFileOf(options);
  return inTurn({ file, work: () => readFileDraft(file) });
}

export function saveItemDraft(options: {
  projectFolder: string;
  draftId: string;
  itemId: string;
  draft: ItemDraft;
}): Promise<Outcome<{ savedAt: string }, string>> {
  const file = takeDraftFileOf(options);
  return inTurn({
    file,
    work: async () => {
      const current = await readFileDraft(file);
      const items = new Map(Object.entries(current.items));
      items.set(options.itemId, options.draft);
      const written = await writeFileAtomic({
        file,
        content: `${JSON.stringify({ items: Object.fromEntries(items) }, null, 2)}\n`,
      });
      return written.ok
        ? { ok: true, value: { savedAt: new Date().toISOString() } }
        : written;
    },
  });
}

export function removeTakeDraft(options: {
  projectFolder: string;
  draftId: string;
}): Promise<void> {
  const file = takeDraftFileOf(options);
  return inTurn({ file, work: () => rm(file, { force: true }) });
}
