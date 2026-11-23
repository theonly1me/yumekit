import { readFile } from "node:fs/promises";

const loadedWords = new Map<string, Promise<Set<string>>>();

async function readWords(lexiconPath: string): Promise<Set<string>> {
  const text = await readFile(lexiconPath, "utf8");
  const words = new Set<string>();
  for (const line of text.split("\n")) {
    const word = line.split(" ", 1)[0];
    if (word) words.add(word);
  }
  return words;
}

export function knownWordsOf(lexiconPath: string): Promise<Set<string>> {
  const loaded = loadedWords.get(lexiconPath) ?? readWords(lexiconPath);
  loadedWords.set(lexiconPath, loaded);
  return loaded;
}

function lookupFormOf(token: string): string {
  return token
    .normalize("NFC")
    .toLowerCase()
    .replaceAll(/[‘’]/g, "'")
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "")
    .replace(/^'+|'+$/g, "");
}

export function unknownWordsOf(options: {
  text: string;
  knownWords: Set<string>;
}): string[] {
  const unknown: string[] = [];
  for (const token of options.text.split(/\s+/)) {
    const word = lookupFormOf(token);
    if (word === "" || options.knownWords.has(word)) continue;
    const pieces = word.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
    const missing = pieces.filter((piece) => !options.knownWords.has(piece));
    if (pieces.length > 0 && missing.length === 0) continue;
    const shown = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!unknown.includes(shown)) unknown.push(shown);
  }
  return unknown;
}
