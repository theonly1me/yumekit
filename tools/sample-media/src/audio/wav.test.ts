import { describe, expect, it } from "vitest";
import { encodeToneWav, readWavDurationSeconds } from "./wav.ts";

function chunk(options: { id: string; data: Buffer }): Buffer {
  const header = Buffer.alloc(8);
  header.write(options.id, 0, "ascii");
  header.writeUInt32LE(options.data.length, 4);
  const padding = Buffer.alloc(options.data.length % 2);
  return Buffer.concat([header, options.data, padding]);
}

function waveFile(chunks: Buffer[]): Buffer {
  const body = Buffer.concat([Buffer.from("WAVE", "ascii"), ...chunks]);
  const header = Buffer.alloc(8);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

function formatChunk(byteRate: number): Buffer {
  const data = Buffer.alloc(16);
  data.writeUInt16LE(1, 0);
  data.writeUInt16LE(1, 2);
  data.writeUInt32LE(byteRate / 2, 4);
  data.writeUInt32LE(byteRate, 8);
  data.writeUInt16LE(2, 12);
  data.writeUInt16LE(16, 14);
  return chunk({ id: "fmt ", data });
}

describe("WAV files", () => {
  it("writes 24000 mono 16-bit samples for each second", () => {
    const tone = encodeToneWav({
      durationSeconds: 0.5,
      frequencyHertz: 440,
      amplitude: 0.1,
    });

    expect(tone.durationSeconds).toBe(0.5);
    expect(tone.bytes.length).toBe(44 + 12000 * 2);
    expect(tone.bytes.toString("ascii", 0, 4)).toBe("RIFF");
    expect(tone.bytes.readUInt32LE(24)).toBe(24000);
    expect(tone.bytes.readUInt16LE(34)).toBe(16);
  });

  it("reads back the length that it wrote", () => {
    const tone = encodeToneWav({
      durationSeconds: 1.25,
      frequencyHertz: 110,
      amplitude: 0.1,
    });

    expect(readWavDurationSeconds(tone.bytes)).toBe(1.25);
  });

  it("skips an odd-sized chunk before the data chunk", () => {
    const bytes = waveFile([
      formatChunk(16000),
      chunk({ id: "LIST", data: Buffer.alloc(3) }),
      chunk({ id: "data", data: Buffer.alloc(8000) }),
    ]);

    expect(readWavDurationSeconds(bytes)).toBe(0.5);
  });

  it("returns undefined for a file that is not WAV", () => {
    expect(readWavDurationSeconds(Buffer.from("ID3 not a wave file"))).toBe(
      undefined,
    );
  });
});
