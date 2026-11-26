import { lstat } from "node:fs/promises";
import { join } from "node:path";

const wordsInName = 6;
const longestFolderName = 48;
const longestProjectName = 40;
const mostFolderNumbers = 1_000;

const filledGuideLine = /^[^:]{1,40}:[ \t]*(\S.*)$/;

function nameLineOf(request: string): string {
  const [firstLine = "", ...rest] = request.trim().split(/\r?\n/);
  if (firstLine.includes(":")) return firstLine;
  const filled = rest
    .map((line) => filledGuideLine.exec(line.trim())?.[1])
    .find((value) => value !== undefined);
  return filled ?? firstLine;
}

function firstWordsOf(request: string): string[] {
  return nameLineOf(request).split(/\s+/).filter(Boolean).slice(0, wordsInName);
}

function cutAtWord(words: string[]): string {
  const [first = ""] = words;
  let name = first.slice(0, longestProjectName);
  for (const word of words.slice(1)) {
    if (name.length + 1 + word.length > longestProjectName) break;
    name = `${name} ${word}`;
  }
  return name;
}

const wordsThatCannotEndAName = /(\s+(the|a|an|of|and|to|in|on|for|with))+$/i;

export function projectNameOf(request: string): string {
  const trimmed = cutAtWord(firstWordsOf(request))
    .replace(/[\s.,;:!?]+$/, "")
    .replace(wordsThatCannotEndAName, "")
    .trim();
  if (trimmed === "") return "New video";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

export function folderNameOf(request: string): string {
  const name = firstWordsOf(request)
    .join(" ")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, longestFolderName)
    .replace(/^-+|-+$/g, "");
  return name === "" ? "video" : name;
}

async function isTaken(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    return !(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    );
  }
}

export async function freeProjectFolder(options: {
  projectsFolder: string;
  folderName: string;
}): Promise<string | undefined> {
  for (let number = 1; number <= mostFolderNumbers; number += 1) {
    const name =
      number === 1
        ? options.folderName
        : `${options.folderName}-${String(number)}`;
    const folder = join(options.projectsFolder, name);
    if (!(await isTaken(folder))) return folder;
  }
  return undefined;
}
