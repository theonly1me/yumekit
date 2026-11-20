import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Edit } from "@yumekit/project";

const sampleRate = 48_000;
const headerBytes = 44;

export function toneWav(options: {
  seconds: number;
  frequencyHertz: number;
}): Buffer {
  const sampleCount = Math.round(options.seconds * sampleRate);
  const wav = Buffer.alloc(headerBytes + sampleCount * 2);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + sampleCount * 2, 4);
  wav.write("WAVEfmt ", 8, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(sampleCount * 2, 40);
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const value = Math.sin(
      (2 * Math.PI * options.frequencyHertz * sampleIndex) / sampleRate,
    );
    wav.writeInt16LE(Math.round(value * 16_000), headerBytes + sampleIndex * 2);
  }
  return wav;
}

export async function addToneAsset(options: {
  folder: string;
  assetId: string;
  durationFrames: number;
  content?: Buffer;
}): Promise<Edit> {
  const file = `assets/files/${options.assetId}.wav`;
  const path = join(options.folder, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    options.content ??
      toneWav({ seconds: options.durationFrames / 30, frequencyHertz: 440 }),
  );
  return {
    kind: "addAsset",
    asset: {
      id: options.assetId,
      kind: "audio",
      file,
      durationFrames: options.durationFrames,
      source: { kind: "import", originalName: `${options.assetId}.wav` },
    },
  };
}
