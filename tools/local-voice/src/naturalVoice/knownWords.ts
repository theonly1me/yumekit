import { readFile } from "node:fs/promises";

export type Lexicon = Map<string, string>;

const loadedLexicons = new Map<string, Promise<Lexicon>>();

async function readLexicon(lexiconPath: string): Promise<Lexicon> {
  const text = await readFile(lexiconPath, "utf8");
  const lexicon: Lexicon = new Map();
  for (const line of text.split("\n")) {
    const space = line.indexOf(" ");
    if (space <= 0) continue;
    const word = line.slice(0, space);
    if (!lexicon.has(word)) lexicon.set(word, line.slice(space + 1).trim());
  }
  return lexicon;
}

export function lexiconOf(lexiconPath: string): Promise<Lexicon> {
  const loaded = loadedLexicons.get(lexiconPath) ?? readLexicon(lexiconPath);
  loadedLexicons.set(lexiconPath, loaded);
  return loaded;
}

export function lookupFormOf(token: string): string {
  return token
    .normalize("NFC")
    .toLowerCase()
    .replaceAll(/[‘’]/g, "'")
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "")
    .replace(/^'+|'+$/g, "");
}

export function unknownWordsOf(options: {
  text: string;
  isKnown: (word: string) => boolean;
}): string[] {
  const { isKnown } = options;
  const unknown: string[] = [];
  for (const token of options.text.split(/\s+/)) {
    const word = lookupFormOf(token);
    if (word === "" || isKnown(word)) continue;
    const pieces = word.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
    const missing = pieces.filter((piece) => !isKnown(piece));
    if (pieces.length > 0 && missing.length === 0) continue;
    const shown = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!unknown.includes(shown)) unknown.push(shown);
  }
  return unknown;
}
