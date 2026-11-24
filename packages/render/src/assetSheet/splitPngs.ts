const signatureLength = 8;
const chunkFramingLength = 12;
const endChunkType = "IEND";

function pngLengthAt(options: { bytes: Buffer; start: number }): number {
  const { bytes, start } = options;
  let offset = start + signatureLength;
  while (offset + chunkFramingLength <= bytes.length) {
    const dataLength = bytes.readUInt32BE(offset);
    const type = bytes.toString("latin1", offset + 4, offset + 8);
    offset += chunkFramingLength + dataLength;
    if (type === endChunkType) return offset - start;
  }
  return bytes.length - start;
}

export function splitPngs(bytes: Buffer): Uint8Array[] {
  const pictures: Uint8Array[] = [];
  let start = 0;
  while (start + signatureLength < bytes.length) {
    const length = pngLengthAt({ bytes, start });
    pictures.push(new Uint8Array(bytes.subarray(start, start + length)));
    start += length;
  }
  return pictures;
}
