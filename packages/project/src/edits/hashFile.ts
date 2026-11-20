import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  );
}

async function isFile(path: string): Promise<boolean> {
  try {
    const status = await stat(path);
    return status.isFile();
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }
    throw error;
  }
}

export async function hashFile(path: string): Promise<string | undefined> {
  if (!(await isFile(path))) {
    return undefined;
  }
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) {
    if (!Buffer.isBuffer(chunk)) {
      throw new Error("A file stream gave a chunk that is not a Buffer.");
    }
    hash.update(chunk);
  }
  return `sha256:${hash.digest("hex")}`;
}
