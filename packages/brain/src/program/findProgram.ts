import { execFile } from "node:child_process";
import { access, constants, stat } from "node:fs/promises";
import { delimiter, isAbsolute, join } from "node:path";

const signInWaitMilliseconds = 15_000;

async function isProgram(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

export async function findProgram(options: {
  program: string;
  searchPath: string;
}): Promise<string | undefined> {
  const folders = options.searchPath
    .split(delimiter)
    .filter((folder) => isAbsolute(folder));
  for (const folder of folders) {
    const file = join(folder, options.program);
    if (await isProgram(file)) return file;
  }
  return undefined;
}

export interface CommandOutput {
  exitCode: number | undefined;
  stdout: string;
}

export function readCommand(options: {
  programPath: string;
  arguments: string[];
}): Promise<CommandOutput> {
  const finished = Promise.withResolvers<CommandOutput>();
  execFile(
    options.programPath,
    options.arguments,
    { timeout: signInWaitMilliseconds, shell: false },
    (...results) => {
      const [error, stdout] = results;
      if (error === null) {
        finished.resolve({ exitCode: 0, stdout });
        return;
      }
      finished.resolve({
        exitCode: typeof error.code === "number" ? error.code : undefined,
        stdout,
      });
    },
  );
  return finished.promise;
}
