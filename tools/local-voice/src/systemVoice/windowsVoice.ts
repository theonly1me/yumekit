import { failureTextOf, type RunProgram } from "./runProgram.ts";
import type { SystemVoice } from "./systemVoice.ts";

const powerShell = "powershell.exe";
const powerShellStart = ["-NoProfile", "-NonInteractive", "-Command"];

const loadSpeech = [
  "[Console]::InputEncoding = [Text.Encoding]::UTF8",
  "[Console]::OutputEncoding = [Text.Encoding]::UTF8",
  "Add-Type -AssemblyName System.Speech",
  "$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer",
];

export const listVoicesScript = [
  ...loadSpeech,
  "$speaker.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Culture.Name + '|' + $_.VoiceInfo.Name }",
].join("; ");

export const speakScript = [
  ...loadSpeech,
  "$speaker.SelectVoice($env:YUMEKIT_VOICE)",
  "$speaker.Rate = [int]$env:YUMEKIT_VOICE_RATE",
  "$speaker.SetOutputToWaveFile($env:YUMEKIT_VOICE_FILE)",
  "$speaker.Speak([Console]::In.ReadToEnd())",
  "$speaker.Dispose()",
].join("; ");

export function rateOf(speed: number): number {
  return Math.max(-10, Math.min(10, Math.round((speed - 1) * 10)));
}

export function englishWindowsVoicesOf(listing: string): string[] {
  return listing
    .split(/\r?\n/)
    .map((line) => line.trim().split("|"))
    .filter(([culture, name]) => culture?.startsWith("en-") && Boolean(name))
    .map(([, name]) => name ?? "");
}

export function windowsVoice(run: RunProgram): SystemVoice {
  return {
    missingProgramMessage:
      "The speech interface of Windows did not answer, so this computer cannot speak now.",
    listVoices: async () => {
      const result = await run({
        command: powerShell,
        args: [...powerShellStart, listVoicesScript],
      });
      if (result.kind !== "finished" || result.exitCode !== 0) return [];
      return englishWindowsVoicesOf(result.output);
    },
    speak: async (options) => {
      const result = await run({
        command: powerShell,
        args: [...powerShellStart, speakScript],
        input: options.text,
        environment: {
          YUMEKIT_VOICE: options.voice,
          YUMEKIT_VOICE_RATE: String(rateOf(options.speed)),
          YUMEKIT_VOICE_FILE: options.path,
        },
      });
      return failureTextOf({
        program: "The speech interface of Windows",
        result,
      });
    },
  };
}
