import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export type RevealTarget =
  { kind: "inside"; file: string } | { kind: "outside" } | { kind: "missing" };

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

export async function revealTargetOf(options: {
  projectFolder: string;
  path: string;
}): Promise<RevealTarget> {
  const folder = await realPathOf(options.projectFolder);
  const file = await realPathOf(resolve(options.projectFolder, options.path));
  if (folder === undefined || file === undefined || !(await isFile(file))) {
    return { kind: "missing" };
  }
  const fromFolder = relative(folder, file);
  const isInside =
    fromFolder !== "" &&
    fromFolder !== ".." &&
    !fromFolder.startsWith(`..${sep}`) &&
    !isAbsolute(fromFolder);
  return isInside ? { kind: "inside", file } : { kind: "outside" };
}
