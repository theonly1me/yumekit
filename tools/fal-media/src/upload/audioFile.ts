import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import type { FrameImage } from "./imageFiles.ts";

export type AudioFile = FrameImage & { seconds: number | undefined };

const audioTypesByExtension: Partial<Record<string, string>> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
};

const riffHeaderBytes = 12;
const chunkHeaderBytes = 8;

export function wavSecondsOf(bytes: Buffer): number | undefined {
  const isWav =
    bytes.length >= riffHeaderBytes &&
    bytes.toString("latin1", 0, 4) === "RIFF" &&
    bytes.toString("latin1", 8, 12) === "WAVE";
  if (!isWav) return undefined;
  let byteRate: number | undefined;
  let offset = riffHeaderBytes;
  while (offset + chunkHeaderBytes <= bytes.length) {
    const name = bytes.toString("latin1", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const body = offset + chunkHeaderBytes;
    if (name === "fmt " && body + 12 <= bytes.length) {
      byteRate = bytes.readUInt32LE(body + 8);
    }
    if (name === "data") {
      return byteRate === undefined || byteRate === 0
        ? undefined
        : size / byteRate;
    }
    offset = body + size + (size % 2);
  }
  return undefined;
}

export async function readAudioFile(
  path: string,
): Promise<Outcome<AudioFile, string>> {
  const contentType = audioTypesByExtension[extname(path).toLowerCase()];
  if (contentType === undefined) {
    return {
      ok: false,
      failure: `audio_path ${path} is not a WAV, MP3, M4A, AAC, OGG, or FLAC file.`,
    };
  }
  try {
    const bytes = await readFile(path);
    return {
      ok: true,
      value: {
        fileName: basename(path),
        contentType,
        bytes,
        seconds: wavSecondsOf(bytes),
      },
    };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read audio_path ${path}: ${errorMessage(error)}`,
    };
  }
}
