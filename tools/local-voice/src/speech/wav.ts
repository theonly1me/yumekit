const headerLength = 44;
const bytesPerSample = 2;
const largestSample = 32767;
const peakAfterLevel = 0.89;

function peakOf(samples: Float32Array): number {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

export function encodeLeveledWav(options: {
  samples: Float32Array;
  sampleRate: number;
}): Buffer {
  const { samples, sampleRate } = options;
  const peak = peakOf(samples);
  const gain = peak === 0 ? 1 : peakAfterLevel / peak;
  const dataLength = samples.length * bytesPerSample;
  const bytes = Buffer.alloc(headerLength + dataLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(headerLength - 8 + dataLength, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * bytesPerSample, 28);
  bytes.writeUInt16LE(bytesPerSample, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataLength, 40);
  samples.forEach((...[sample, index]) => {
    const leveled = Math.max(-1, Math.min(1, sample * gain));
    bytes.writeInt16LE(
      Math.round(leveled * largestSample),
      headerLength + index * bytesPerSample,
    );
  });
  return bytes;
}
