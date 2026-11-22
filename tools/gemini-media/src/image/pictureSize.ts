export interface PictureSize {
  width: number;
  height: number;
}

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const jpegFrameMarkers = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function pngSize(bytes: Buffer): PictureSize | undefined {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
    return undefined;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegSize(bytes: Buffer): PictureSize | undefined {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return undefined;
  }
  let offset = 2;
  while (offset + 9 <= bytes.length) {
    if (bytes[offset] !== 0xff) return undefined;
    const marker = bytes.readUInt8(offset + 1);
    const segmentLength = bytes.readUInt16BE(offset + 2);
    if (jpegFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }
  return undefined;
}

export function readPictureSize(bytes: Buffer): PictureSize | undefined {
  return pngSize(bytes) ?? jpegSize(bytes);
}
