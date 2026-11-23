const sharedWords = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function wordKeyOf(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function keysOf(part: string): string[] {
  return part
    .split(/\s+/)
    .map(wordKeyOf)
    .filter((key) => key !== "" && !sharedWords.has(key));
}

function isInsideAnother(options: { part: string; parts: string[] }): boolean {
  const keys = keysOf(options.part);
  return options.parts.some((other) => {
    if (other === options.part) return false;
    const otherKeys = new Set(keysOf(other));
    return (
      otherKeys.size > keys.length && keys.every((key) => otherKeys.has(key))
    );
  });
}

function withoutUsedWords(options: {
  part: string;
  used: Set<string>;
}): string {
  const kept = options.part.split(/\s+/).filter((word) => {
    const key = wordKeyOf(word);
    if (key === "" || sharedWords.has(key)) return true;
    if (options.used.has(key)) return false;
    options.used.add(key);
    return true;
  });
  return kept
    .join(" ")
    .replace(/^[\s,;:]+|[\s,;:]+$/g, "")
    .trim();
}

export function distinctParts(parts: string[]): string[] {
  const unique = [...new Set(parts)];
  const outer = unique.filter(
    (part) => !isInsideAnother({ part, parts: unique }),
  );
  const used = new Set<string>();
  return outer
    .map((part) => withoutUsedWords({ part, used }))
    .filter((part) => keysOf(part).length > 0);
}
