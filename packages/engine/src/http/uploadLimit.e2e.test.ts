import { request } from "node:http";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import { bodyOf, type RawResponse } from "../testing/rawRequest.js";
import { uploadRequest, wavBytes } from "../testing/uploadRequest.js";

const megabyte = 1024 * 1024;
const limitBytes = 500 * megabyte;

function streamedUpload(options: {
  port: number;
  token: string;
  totalBytes: number;
}): Promise<RawResponse> {
  const answered = Promise.withResolvers<RawResponse>();
  const sent = request(
    {
      host: "127.0.0.1",
      port: options.port,
      path: "/api/uploads?name=large.wav",
      method: "POST",
      headers: { authorization: `Bearer ${options.token}` },
    },
    (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        answered.resolve({
          status: response.statusCode ?? 0,
          headers: response.headers,
          body: bytes.toString(),
          bytes,
        });
      });
    },
  );
  sent.on("error", answered.reject);
  const chunk = Buffer.alloc(4 * megabyte, 1);
  let remaining = options.totalBytes;
  const writeMore = () => {
    while (remaining > 0) {
      const part = chunk.subarray(0, Math.min(chunk.length, remaining));
      remaining -= part.length;
      if (!sent.write(part)) {
        sent.once("drain", writeMore);
        return;
      }
    }
    sent.end();
  };
  writeMore();
  return answered.promise;
}

async function keptLargeFiles(): Promise<string[]> {
  const names = await readdir(tmpdir());
  const folders = names.filter((name) => name.startsWith("yumekit-upload-"));
  const files = await Promise.all(
    folders.map((folder) => readdir(join(tmpdir(), folder)).catch(() => [])),
  );
  return files.flat().filter((name) => name === "large.wav");
}

describe("the limit of an upload", () => {
  it("refuses a file that says it is larger than 500 MB before it reads it", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      name: "large.wav",
      body: wavBytes(1),
      headers: { "content-length": String(limitBytes + 1) },
    });

    expect(uploaded.status).toBe(413);
    expect(bodyOf(uploaded)).toMatchObject({ kind: "upload-too-large" });
  });

  it("refuses a streamed file past 500 MB and keeps no part of it", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await streamedUpload({
      ...engine,
      totalBytes: limitBytes + 1,
    });

    expect(uploaded.status).toBe(413);
    expect(bodyOf(uploaded)).toMatchObject({ kind: "upload-too-large" });
    expect(await keptLargeFiles()).toEqual([]);
  });
});
