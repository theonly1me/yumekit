import { existsSync } from "node:fs";
import { chmod, mkdir, symlink, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";

const systemFolders = ["/usr/bin", "/bin"];

export function pathWithSystemFolders(folder: string): string {
  return [folder, ...systemFolders].join(delimiter);
}

export async function linkMediaPrograms(folder: string): Promise<void> {
  const searched = (process.env["PATH"] ?? "").split(delimiter);
  for (const program of ["ffmpeg", "ffprobe"]) {
    const found = searched
      .map((searchedFolder) => join(searchedFolder, program))
      .find((candidate) => existsSync(candidate));
    if (found !== undefined) await symlink(found, join(folder, program));
  }
}

export function callsFileOf(options: {
  root: string;
  program: string;
}): string {
  return join(options.root, "bin", `${options.program}.calls`);
}

export async function installRecordingPrograms(options: {
  root: string;
  path: string;
  programs: readonly string[];
}): Promise<void> {
  const [folder] = options.path.split(delimiter);
  if (folder === undefined) return;
  for (const program of options.programs) {
    const calls = callsFileOf({ root: options.root, program });
    await writeFile(
      join(folder, program),
      `#!/bin/sh\nprintf '%s\\n' "$@" >> '${calls}'\n`,
    );
    await chmod(join(folder, program), 0o755);
  }
}

export async function pathOfTestPrograms(options: {
  root: string;
  agentPrograms: string[];
}): Promise<string> {
  const folder = join(options.root, "bin");
  await mkdir(folder);
  await symlink(process.execPath, join(folder, "node"));
  await linkMediaPrograms(folder);
  for (const program of options.agentPrograms) {
    await writeFile(join(folder, program), "#!/bin/sh\n");
    await chmod(join(folder, program), 0o755);
  }
  return pathWithSystemFolders(folder);
}
