import { noiseAt } from "./compose/random.ts";
import type { Music } from "./makeMusic.ts";

const headerLength = 44;
const channels = 2;
const bytesPerSample = 2;
const largestSample = 32767;

export function encodeWav(music: Music): Buffer {
  const frames = music.left.length;
  const dataLength = frames * channels * bytesPerSample;
  const bytes = Buffer.alloc(headerLength + dataLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(headerLength - 8 + dataLength, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(channels, 22);
  bytes.writeUInt32LE(music.sampleRate, 24);
  bytes.writeUInt32LE(music.sampleRate * channels * bytesPerSample, 28);
  bytes.writeUInt16LE(channels * bytesPerSample, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataLength, 40);
  for (let frame = 0; frame < frames; frame += 1) {
    const sides = [music.left[frame] ?? 0, music.right[frame] ?? 0];
    sides.forEach((...[value, side]) => {
      const noiseIndex = frame * 4 + side * 2;
      const dither = (noiseAt(noiseIndex) + noiseAt(noiseIndex + 1)) / 2;
      const scaled = value === 0 ? 0 : value * largestSample + dither;
      const clamped = Math.max(
        -largestSample,
        Math.min(largestSample, Math.round(scaled)),
      );
      bytes.writeInt16LE(
        clamped,
        headerLength + (frame * channels + side) * bytesPerSample,
      );
    });
  }
  return bytes;
}
