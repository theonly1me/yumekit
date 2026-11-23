import { failureTextOf, type RunProgram } from "./runProgram.ts";
import type { SystemVoice } from "./systemVoice.ts";

const wordsPerMinuteAtNormalSpeed = 180;

const noveltyVoices = new Set([
  "Albert",
  "Bad News",
  "Bahh",
  "Bells",
  "Boing",
  "Bubbles",
  "Cellos",
  "Fred",
  "Good News",
  "Jester",
  "Junior",
  "Kathy",
  "Organ",
  "Ralph",
  "Superstar",
  "Trinoids",
  "Whisper",
  "Wobble",
  "Zarvox",
]);

const plainNamedVoices = new Set([
  "Samantha",
  "Ava",
  "Allison",
  "Susan",
  "Tom",
  "Alex",
  "Evan",
  "Nathan",
  "Zoe",
  "Joelle",
  "Noelle",
  "Daniel",
  "Karen",
  "Moira",
  "Tessa",
  "Serena",
  "Kate",
  "Oliver",
  "Jamie",
]);

const voiceLine = /^(?<name>.+?)\s+(?<locale>[a-z]{2,3}_[A-Za-z0-9]{2,4})\s+#/;

const localesInOrder = ["en_US", "en_GB"];

function rankOf(voice: { name: string; locale: string }): number {
  const localeIndex = localesInOrder.indexOf(voice.locale);
  const localeRank = localeIndex === -1 ? localesInOrder.length : localeIndex;
  const firstWord = voice.name.split(" ")[0] ?? voice.name;
  const qualityRank = voice.name.includes("(Premium)")
    ? 0
    : voice.name.includes("(Enhanced)")
      ? 1
      : plainNamedVoices.has(firstWord)
        ? 2
        : 3;
  return qualityRank * 10 + localeRank;
}

export function englishVoicesOf(listing: string): string[] {
  const voices: { name: string; locale: string }[] = [];
  for (const line of listing.split("\n")) {
    const match = voiceLine.exec(line.trim());
    const name = match?.groups?.["name"];
    const locale = match?.groups?.["locale"];
    if (name === undefined || locale === undefined) continue;
    if (!locale.startsWith("en_") || noveltyVoices.has(name)) continue;
    if (!voices.some((voice) => voice.name === name))
      voices.push({ name, locale });
  }
  return voices
    .map((...[voice, index]) => ({
      name: voice.name,
      index,
      rank: rankOf(voice),
    }))
    .sort(
      (...[left, right]) => left.rank - right.rank || left.index - right.index,
    )
    .map((entry) => entry.name);
}

export function macVoice(run: RunProgram): SystemVoice {
  return {
    missingProgramMessage:
      "The say program of macOS did not answer, so this computer cannot speak now.",
    listVoices: async () => {
      const result = await run({ command: "say", args: ["-v", "?"] });
      if (result.kind !== "finished" || result.exitCode !== 0) return [];
      return englishVoicesOf(result.output);
    },
    speak: async (options) => {
      const result = await run({
        command: "say",
        args: [
          ...["-v", options.voice],
          ...[
            "-r",
            String(Math.round(wordsPerMinuteAtNormalSpeed * options.speed)),
          ],
          ...["-o", options.path],
          "--file-format=WAVE",
          "--data-format=LEI16@24000",
          ...["-f", "-"],
        ],
        input: options.text,
      });
      return failureTextOf({ program: "say", result });
    },
  };
}
