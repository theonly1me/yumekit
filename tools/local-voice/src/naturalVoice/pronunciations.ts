import type { Outcome } from "../toolResults.ts";
import { lookupFormOf, type Lexicon } from "./knownWords.ts";

export type Pronunciations = Record<string, string>;

const primaryStress = "ˈ";
const secondaryStress = "ˌ";

function joinedPhonemes(parts: string[]): string {
  let hasPrimary = false;
  return parts
    .join(" ")
    .split(" ")
    .map((phoneme) => {
      if (phoneme !== primaryStress) return phoneme;
      if (!hasPrimary) {
        hasPrimary = true;
        return phoneme;
      }
      return secondaryStress;
    })
    .join(" ");
}

function soundingWordsOf(spelling: string): string[] {
  return spelling
    .split(/[\s-]+/)
    .map(lookupFormOf)
    .filter((word) => word !== "");
}

export function pronunciationLinesOf(options: {
  pronunciations: Pronunciations;
  lexicon: Lexicon;
}): Outcome<string[], string> {
  const lines: string[] = [];
  for (const [word, spelling] of Object.entries(options.pronunciations)) {
    const key = lookupFormOf(word);
    const soundingWords = soundingWordsOf(spelling);
    if (key === "" || /\s/.test(key) || soundingWords.length === 0) {
      return {
        ok: false,
        failure: `pronunciations needs one word as each key and common English words as each value. "${word}": "${spelling}" is not that.`,
      };
    }
    const parts: string[] = [];
    for (const soundingWord of soundingWords) {
      const phonemes = options.lexicon.get(soundingWord);
      if (phonemes === undefined) {
        return {
          ok: false,
          failure: `The natural voice does not know "${soundingWord}" in the sound spelling of "${word}". Spell "${word}" with other common English words.`,
        };
      }
      parts.push(phonemes);
    }
    lines.push(`${key} ${joinedPhonemes(parts)}`);
  }
  return { ok: true, value: lines };
}
