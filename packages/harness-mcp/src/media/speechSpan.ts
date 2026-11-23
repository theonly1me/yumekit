import { readFile } from "node:fs/promises";

export interface SpeechSpan {
  startSeconds: number;
  endSeconds: number;
}

const soundLevel = 0.02 * 32767;
const chunkHeaderLength = 8;
const firstChunkOffset = 12;
const pcmFormat = 1;

interface PcmData {
  offset: number;
  length: number;
  sampleRate: number;
  channelCount: number;
}

function pcmDataOf(bytes: Buffer): PcmData | undefined {
  if (bytes.toString("ascii", 0, 4) !== "RIFF") return undefined;
  if (bytes.toString("ascii", 8, 12) !== "WAVE") return undefined;
  let format: Omit<PcmData, "offset" | "length"> | undefined;
  let offset = firstChunkOffset;
  while (offset + chunkHeaderLength <= bytes.length) {
    const chunkId = bytes.toString("ascii", offset, offset + 4);
    const declared = bytes.readUInt32LE(offset + 4);
    const body = offset + chunkHeaderLength;
    if (chunkId === "fmt " && body + 16 <= bytes.length) {
      const isPcm16 =
        bytes.readUInt16LE(body) === pcmFormat &&
        bytes.readUInt16LE(body + 14) === 16;
      if (!isPcm16) return undefined;
      format = {
        channelCount: bytes.readUInt16LE(body + 2),
        sampleRate: bytes.readUInt32LE(body + 4),
      };
    }
    if (chunkId === "data" && format !== undefined) {
      return {
        ...format,
        offset: body,
        length: Math.min(declared, bytes.length - body),
      };
    }
    offset = body + declared + (declared % 2);
  }
  return undefined;
}

export async function speechSpanOf(
  path: string,
): Promise<SpeechSpan | undefined> {
  const bytes = await readFile(path).catch(() => undefined);
  if (bytes === undefined) return undefined;
  const data = pcmDataOf(bytes);
  if (data === undefined || data.channelCount < 1) return undefined;
  const frameBytes = 2 * data.channelCount;
  const frameCount = Math.floor(data.length / frameBytes);
  let first: number | undefined;
  let last: number | undefined;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const sample = bytes.readInt16LE(data.offset + frame * frameBytes);
    if (Math.abs(sample) < soundLevel) continue;
    first ??= frame;
    last = frame;
  }
  if (first === undefined || last === undefined) return undefined;
  return {
    startSeconds: first / data.sampleRate,
    endSeconds: (last + 1) / data.sampleRate,
  };
}
