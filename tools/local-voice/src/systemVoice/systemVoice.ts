import { linuxVoice } from "./linuxVoice.ts";
import { macVoice } from "./macVoice.ts";
import type { RunProgram } from "./runProgram.ts";
import { windowsVoice } from "./windowsVoice.ts";

export interface SystemVoice {
  missingProgramMessage: string;
  listVoices: () => Promise<string[]>;
  speak: (options: {
    text: string;
    voice: string;
    speed: number;
    path: string;
  }) => Promise<string | undefined>;
}

export function systemVoiceOf(options: {
  platform: NodeJS.Platform;
  run: RunProgram;
}): SystemVoice {
  if (options.platform === "darwin") return macVoice(options.run);
  if (options.platform === "win32") return windowsVoice(options.run);
  return linuxVoice(options.run);
}
