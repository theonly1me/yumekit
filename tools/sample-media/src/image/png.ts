import { crc32, deflateSync } from "node:zlib";

export interface RgbaImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const bitDepth = 8;
const colorTypeRgba = 6;
const bytesPerPixel = 4;

function pngChunk(options: { type: string; data: Buffer }): Buffer {
  const typeAndData = Buffer.concat([
    Buffer.from(options.type, "ascii"),
    options.data,
  ]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(options.data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

function headerData(image: RgbaImage): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header.writeUInt8(bitDepth, 8);
  header.writeUInt8(colorTypeRgba, 9);
  return header;
}

function scanlines(image: RgbaImage): Buffer {
  const rowLength = image.width * bytesPerPixel;
  const output = Buffer.alloc((rowLength + 1) * image.height);
  for (let rowIndex = 0; rowIndex < image.height; rowIndex += 1) {
    const rowStart = rowIndex * rowLength;
    output.set(
      image.pixels.subarray(rowStart, rowStart + rowLength),
      rowIndex * (rowLength + 1) + 1,
    );
  }
  return output;
}

export function encodePng(image: RgbaImage): Buffer {
  return Buffer.concat([
    pngSignature,
    pngChunk({ type: "IHDR", data: headerData(image) }),
    pngChunk({ type: "IDAT", data: deflateSync(scanlines(image)) }),
    pngChunk({ type: "IEND", data: Buffer.alloc(0) }),
  ]);
}
