function wordsOf(text: string): string[] {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replaceAll(/[‘’]/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .map((word) => word.replace(/^'+|'+$/g, ""))
    .filter((word) => word !== "");
}

function containsRun(options: { words: string[]; run: string[] }): boolean {
  const { words, run } = options;
  if (run.length === 0) return true;
  for (let start = 0; start + run.length <= words.length; start += 1) {
    const piece = words.slice(start, start + run.length).join(" ");
    if (piece === run.join(" ")) return true;
  }
  return false;
}

export function voiceMatchesScript(options: {
  script: string;
  voiceTexts: string[];
}): boolean {
  const scriptWords = wordsOf(options.script);
  if (scriptWords.length === 0) return true;
  return options.voiceTexts.every((text) =>
    containsRun({ words: scriptWords, run: wordsOf(text) }),
  );
}
