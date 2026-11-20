import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { encodePng } from "./png.ts";

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

describe("PNG files", () => {
  it("writes the signature, the size, and RGBA rows with filter byte 0", () => {
    const bytes = encodePng({
      width: 2,
      height: 1,
      pixels: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 128]),
    });

    expect([...bytes.subarray(0, 8)]).toEqual(pngSignature);
    expect(bytes.toString("ascii", 12, 16)).toBe("IHDR");
    expect(bytes.readUInt32BE(16)).toBe(2);
    expect(bytes.readUInt32BE(20)).toBe(1);
    expect(bytes.readUInt8(24)).toBe(8);
    expect(bytes.readUInt8(25)).toBe(6);
    const imageDataLength = bytes.readUInt32BE(33);
    expect(bytes.toString("ascii", 37, 41)).toBe("IDAT");
    expect([...inflateSync(bytes.subarray(41, 41 + imageDataLength))]).toEqual([
      0, 255, 0, 0, 255, 0, 0, 255, 128,
    ]);
    expect(bytes.toString("ascii", bytes.length - 8, bytes.length - 4)).toBe(
      "IEND",
    );
  });
});
