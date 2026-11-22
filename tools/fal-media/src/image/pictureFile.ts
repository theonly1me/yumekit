export interface PictureFacts {
  extension: "png" | "jpg" | "webp";
  widthPixels?: number;
  heightPixels?: number;
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngSize(bytes: Buffer) {
  if (bytes.length < 24 || bytes.toString("latin1", 12, 16) !== "IHDR") {
    return {};
  }
  return {
    widthPixels: bytes.readUInt32BE(16),
    heightPixels: bytes.readUInt32BE(20),
  };
}

export function pictureFacts(bytes: Buffer): PictureFacts | undefined {
  if (bytes.subarray(0, 8).equals(pngSignature)) {
    return { extension: "png", ...pngSize(bytes) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg" };
  }
  if (
    bytes.toString("latin1", 0, 4) === "RIFF" &&
    bytes.toString("latin1", 8, 12) === "WEBP"
  ) {
    return { extension: "webp" };
  }
  return undefined;
}
