import { readdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { errorMessage, type Outcome } from "../toolResults.ts";
import { readPngSize, type PictureSize } from "./pictureShape.ts";

const plainThreadId = /^[A-Za-z0-9-]+$/;

export interface MadePicture {
  bytes: Buffer;
  size: PictureSize;
}

export function pictureFolderOf(options: {
  codexHome: string;
  threadId: string | undefined;
}): string | undefined {
  const { threadId } = options;
  if (threadId === undefined || !plainThreadId.test(threadId)) return undefined;
  return join(options.codexHome, "generated_images", threadId);
}

async function newestPicture(folder: string): Promise<string | undefined> {
  let names: string[];
  try {
    names = await readdir(folder);
  } catch {
    return undefined;
  }
  const pictures = await Promise.all(
    names
      .filter((name) => name.toLowerCase().endsWith(".png"))
      .map(async (name) => {
        const path = join(folder, name);
        return { path, modified: (await stat(path)).mtimeMs };
      }),
  );
  return pictures.toSorted(
    (...[first, second]) => second.modified - first.modified,
  )[0]?.path;
}

export async function takePicture(options: {
  codexHome: string;
  threadId: string | undefined;
  answer: string;
}): Promise<Outcome<MadePicture, string>> {
  const folder = pictureFolderOf(options);
  const path = folder === undefined ? undefined : await newestPicture(folder);
  if (path === undefined) {
    const said = options.answer.trim();
    return {
      ok: false,
      failure: `Codex finished, but it made no picture.${said === "" ? "" : ` Codex said: ${said}`}`,
    };
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read the picture of Codex: ${errorMessage(error)}`,
    };
  }
  const size = readPngSize(bytes);
  if (size === undefined) {
    return {
      ok: false,
      failure: "Codex wrote a file that is not a PNG picture.",
    };
  }
  return { ok: true, value: { bytes, size } };
}

export async function removePictureFolder(options: {
  codexHome: string;
  threadId: string | undefined;
}): Promise<void> {
  const folder = pictureFolderOf(options);
  if (folder === undefined) return;
  await rm(folder, { recursive: true, force: true });
}
