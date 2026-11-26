import { rawRequest, withToken, type RawResponse } from "./rawRequest.js";

const sampleRate = 8000;

export function wavBytes(seconds: number): Buffer {
  const dataSize = Math.round(seconds * sampleRate) * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  const samples = Buffer.alloc(dataSize);
  for (let offset = 0; offset < dataSize; offset += 2) {
    samples.writeInt16LE(Math.round(Math.sin(offset / 9) * 3000), offset);
  }
  return Buffer.concat([header, samples]);
}

export function uploadRequest(options: {
  port: number;
  token: string | undefined;
  name: string;
  body: Buffer;
  headers?: Record<string, string>;
  actId?: string;
}): Promise<RawResponse> {
  const tokenHeaders =
    options.token === undefined ? {} : withToken({ token: options.token });
  const query = new URLSearchParams({
    name: options.name,
    ...(options.actId === undefined ? {} : { act: options.actId }),
  });
  return rawRequest({
    port: options.port,
    path: `/api/uploads?${query.toString()}`,
    method: "POST",
    headers: {
      ...tokenHeaders,
      "content-type": "application/octet-stream",
      ...options.headers,
    },
    body: options.body,
  });
}
