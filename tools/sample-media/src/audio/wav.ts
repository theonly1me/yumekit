const sampleRate = 24000;
const bytesPerSample = 2;
const channelCount = 1;
const headerLength = 44;
const fullScale = 32767;
const pcmFormat = 1;

export interface ToneFile {
  bytes: Buffer;
  durationSeconds: number;
}

export function encodeToneWav(options: {
  durationSeconds: number;
  frequencyHertz: number;
  amplitude: number;
}): ToneFile {
  const sampleCount = Math.max(
    1,
    Math.round(options.durationSeconds * sampleRate),
  );
  const dataLength = sampleCount * bytesPerSample * channelCount;
  const bytes = Buffer.alloc(headerLength + dataLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(headerLength - 8 + dataLength, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(pcmFormat, 20);
  bytes.writeUInt16LE(channelCount, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * bytesPerSample * channelCount, 28);
  bytes.writeUInt16LE(bytesPerSample * channelCount, 32);
  bytes.writeUInt16LE(bytesPerSample * 8, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataLength, 40);
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const phase =
      (2 * Math.PI * options.frequencyHertz * sampleIndex) / sampleRate;
    const value = Math.round(Math.sin(phase) * options.amplitude * fullScale);
    bytes.writeInt16LE(value, headerLength + sampleIndex * bytesPerSample);
  }
  return { bytes, durationSeconds: sampleCount / sampleRate };
}

function chunkByteRate(options: { bytes: Buffer; offset: number }): number {
  return options.bytes.readUInt32LE(options.offset + 16);
}

export function readWavDurationSeconds(bytes: Buffer): number | undefined {
  const isWave =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WAVE";
  if (!isWave) return undefined;
  let byteRate: number | undefined;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkId = bytes.toString("ascii", offset, offset + 4);
    const chunkLength = bytes.readUInt32LE(offset + 4);
    if (chunkId === "fmt " && offset + 20 <= bytes.length) {
      byteRate = chunkByteRate({ bytes, offset });
    }
    if (chunkId === "data" && byteRate) return chunkLength / byteRate;
    offset += 8 + chunkLength + (chunkLength % 2);
  }
  return undefined;
}
