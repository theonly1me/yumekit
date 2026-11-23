import { createHash } from "node:crypto";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import {
  totalBytesOf,
  type ModelFile,
  type NaturalModel,
} from "./modelFiles.ts";

const bytesBetweenReports = 4_000_000;

export type FetchFile = (url: string) => Promise<Response>;

async function hasFile(options: {
  folder: string;
  file: ModelFile;
}): Promise<boolean> {
  try {
    const found = await stat(join(options.folder, options.file.name));
    return found.isFile() && found.size === options.file.bytes;
  } catch {
    return false;
  }
}

export async function isModelDownloaded(options: {
  folder: string;
  model: NaturalModel;
}): Promise<boolean> {
  const { folder } = options;
  for (const file of options.model.files) {
    if (!(await hasFile({ folder, file }))) return false;
  }
  return true;
}

async function downloadFile(options: {
  folder: string;
  file: ModelFile;
  sourceUrl: string;
  fetchFile: FetchFile;
  onBytes: (bytes: number) => Promise<void>;
}): Promise<Outcome<true, string>> {
  const { folder, file } = options;
  const response = await options.fetchFile(`${options.sourceUrl}/${file.name}`);
  if (!response.ok || response.body === null) {
    await response.body?.cancel();
    return {
      ok: false,
      failure: `The download of ${file.name} failed with status ${String(response.status)}.`,
    };
  }
  const partPath = join(folder, `${file.name}.part`);
  const hash = createHash("sha256");
  let received = 0;
  const handle = await open(partPath, "w");
  try {
    const reader = response.body.getReader();
    for (
      let read = await reader.read();
      !read.done;
      read = await reader.read()
    ) {
      const chunk: unknown = read.value;
      if (!(chunk instanceof Uint8Array)) break;
      hash.update(chunk);
      received += chunk.byteLength;
      await handle.write(chunk);
      await options.onBytes(chunk.byteLength);
    }
  } finally {
    await handle.close();
  }
  if (received !== file.bytes || hash.digest("hex") !== file.sha256) {
    await rm(partPath, { force: true });
    return {
      ok: false,
      failure: `The download of ${file.name} is not complete or not the expected file. Try again.`,
    };
  }
  await rename(partPath, join(folder, file.name));
  return { ok: true, value: true };
}

export async function downloadModel(options: {
  folder: string;
  model: NaturalModel;
  fetchFile: FetchFile;
  onProgress: (progress: { done: number; total: number }) => Promise<void>;
}): Promise<Outcome<true, string>> {
  let done = 0;
  let reported = 0;
  try {
    await mkdir(options.folder, { recursive: true, mode: 0o700 });
    for (const file of options.model.files) {
      if (await hasFile({ folder: options.folder, file })) {
        done += file.bytes;
        continue;
      }
      const downloaded = await downloadFile({
        folder: options.folder,
        file,
        sourceUrl: options.model.sourceUrl,
        fetchFile: options.fetchFile,
        onBytes: async (bytes) => {
          done += bytes;
          if (done - reported < bytesBetweenReports) return;
          reported = done;
          await options.onProgress({
            done,
            total: totalBytesOf(options.model),
          });
        },
      });
      if (!downloaded.ok) return downloaded;
    }
    return { ok: true, value: true };
  } catch (error) {
    return {
      ok: false,
      failure: `The download of the natural voice failed: ${errorMessage(error)}`,
    };
  }
}
