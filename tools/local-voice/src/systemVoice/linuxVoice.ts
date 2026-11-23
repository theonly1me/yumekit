import { failureTextOf, type RunProgram } from "./runProgram.ts";
import type { SystemVoice } from "./systemVoice.ts";

const wordsPerMinuteAtNormalSpeed = 165;
const preferredLanguages = ["en-us", "en-gb", "en"];

function rankOf(language: string): number {
  const index = preferredLanguages.indexOf(language);
  return index === -1 ? preferredLanguages.length : index;
}

export function englishEspeakVoicesOf(listing: string): string[] {
  const languages = listing
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[1] ?? "")
    .filter((language) => language === "en" || language.startsWith("en-"));
  return [...new Set(languages)]
    .map((...[language, index]) => ({
      language,
      index,
      rank: rankOf(language),
    }))
    .sort(
      (...[left, right]) => left.rank - right.rank || left.index - right.index,
    )
    .map((entry) => entry.language);
}

export function linuxVoice(run: RunProgram): SystemVoice {
  return {
    missingProgramMessage:
      "This computer has no voice program. Install espeak-ng (for example with sudo apt install espeak-ng), or pick the natural voice in Settings.",
    listVoices: async () => {
      const result = await run({ command: "espeak-ng", args: ["--voices=en"] });
      if (result.kind !== "finished" || result.exitCode !== 0) return [];
      return englishEspeakVoicesOf(result.output);
    },
    speak: async (options) => {
      const result = await run({
        command: "espeak-ng",
        args: [
          ...["-v", options.voice],
          ...[
            "-s",
            String(Math.round(wordsPerMinuteAtNormalSpeed * options.speed)),
          ],
          ...["-w", options.path],
          "--stdin",
        ],
        input: options.text,
      });
      return failureTextOf({ program: "espeak-ng", result });
    },
  };
}
