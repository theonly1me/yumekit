import { realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";

async function realPathOf(path: string): Promise<string | undefined> {
  try {
    return await realpath(path);
  } catch {
    return undefined;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export async function fileInside(options: {
  folder: string;
  segments: string[];
}): Promise<string | undefined> {
  const folder = await realPathOf(options.folder);
  if (folder === undefined) return undefined;
  const file = await realPathOf(join(folder, ...options.segments));
  if (file === undefined) return undefined;
  const fromFolder = relative(folder, file);
  const isInside =
    fromFolder !== "" &&
    fromFolder !== ".." &&
    !fromFolder.startsWith(`..${sep}`) &&
    !isAbsolute(fromFolder);
  return isInside && (await isFile(file)) ? file : undefined;
}
