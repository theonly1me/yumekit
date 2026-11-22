const chunkHeaderLength = 8;
const firstChunkOffset = 12;

function isWave(bytes: Buffer): boolean {
  return (
    bytes.length >= firstChunkOffset &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WAVE"
  );
}

export function readWavDurationSeconds(bytes: Buffer): number | undefined {
  if (!isWave(bytes)) return undefined;
  let byteRate = 0;
  let offset = firstChunkOffset;
  while (offset + chunkHeaderLength <= bytes.length) {
    const chunkId = bytes.toString("ascii", offset, offset + 4);
    const declaredLength = bytes.readUInt32LE(offset + 4);
    const bodyOffset = offset + chunkHeaderLength;
    if (chunkId === "fmt " && bodyOffset + 12 <= bytes.length) {
      byteRate = bytes.readUInt32LE(bodyOffset + 8);
    }
    if (chunkId === "data") {
      if (byteRate === 0) return undefined;
      const presentLength = Math.min(declaredLength, bytes.length - bodyOffset);
      return presentLength / byteRate;
    }
    offset = bodyOffset + declaredLength + (declaredLength % 2);
  }
  return undefined;
}
