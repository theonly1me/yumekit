import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";

export const largestAudioBytes = 25 * 1024 * 1024;

const audioTypesByExtension: Partial<Record<string, string>> = {
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "audio/mp4",
  ".mpeg": "audio/mpeg",
  ".mpga": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
};

export async function readAudioFile(
  path: string,
): Promise<Outcome<File, string>> {
  const type = audioTypesByExtension[extname(path).toLowerCase()];
  if (!type) {
    return {
      ok: false,
      failure: `${path} must be a flac, m4a, mp3, mp4, mpeg, mpga, ogg, wav, or webm file.`,
    };
  }
  try {
    const { size } = await stat(path);
    if (size > largestAudioBytes) {
      return {
        ok: false,
        failure: `${path} is larger than 25 MB. Split or compress the audio first.`,
      };
    }
    const bytes = await readFile(path);
    return { ok: true, value: new File([bytes], basename(path), { type }) };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read ${path}: ${errorMessage(error)}`,
    };
  }
}
