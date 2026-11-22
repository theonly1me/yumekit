export function fakePng(size: { width: number; height: number }): Buffer {
  const header = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(size.width, 16);
  header.writeUInt32BE(size.height, 20);
  return header;
}

export function fakeWav(options: {
  sampleRate: number;
  sampleCount: number;
}): Buffer {
  const bytesPerSample = 2;
  const dataBytes = options.sampleCount * bytesPerSample;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(options.sampleRate, 24);
  header.writeUInt32LE(options.sampleRate * bytesPerSample, 28);
  header.writeUInt16LE(bytesPerSample, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.alloc(dataBytes)]);
}

const mpegOneLayerThree128KilobitsAt44100 = 0xfffb9000;

const bytesOfThatFrame = 417;

export function fakeMp3(options: { frameCount: number }): Buffer {
  const frame = Buffer.alloc(bytesOfThatFrame);
  frame.writeUInt32BE(mpegOneLayerThree128KilobitsAt44100, 0);
  const tag = Buffer.from([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 2, 0, 0]);
  return Buffer.concat([
    tag,
    ...Array.from({ length: options.frameCount }, () => frame),
  ]);
}

export function completedOutput(options: {
  id: string;
  type: "image" | "audio";
  mimeType: string;
  bytes: Buffer;
}): () => Response {
  return () =>
    Response.json({
      id: options.id,
      status: "completed",
      steps: [
        {
          type: "model_output",
          content: [
            {
              type: options.type,
              mime_type: options.mimeType,
              data: options.bytes.toString("base64"),
            },
          ],
        },
      ],
    });
}
