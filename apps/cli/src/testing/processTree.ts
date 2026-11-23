import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

const browserCacheFolders: Partial<Record<NodeJS.Platform, string>> = {
  darwin: join("Library", "Caches", "ms-playwright"),
  linux: join(".cache", "ms-playwright"),
  win32: join("AppData", "Local", "ms-playwright"),
};

export function browsersPath(): string {
  return (
    process.env["PLAYWRIGHT_BROWSERS_PATH"] ??
    join(homedir(), browserCacheFolders[process.platform] ?? "")
  );
}

interface ProcessRow {
  processId: number;
  parentId: number;
  command: string;
}

async function processRows(): Promise<ProcessRow[]> {
  const { stdout } = await run("ps", ["-axo", "pid=,ppid=,command="]);
  return stdout
    .trim()
    .split("\n")
    .flatMap((line) => {
      const [, processId, parentId, command] =
        /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line) ?? [];
      return processId === undefined ||
        parentId === undefined ||
        command === undefined
        ? []
        : [
            {
              processId: Number(processId),
              parentId: Number(parentId),
              command,
            },
          ];
    });
}

export async function processesStartedBy(
  rootProcessId: number,
): Promise<ProcessRow[]> {
  const rows = await processRows();
  const tree = new Set([rootProcessId]);
  let isGrowing = true;
  while (isGrowing) {
    const added = rows.filter(
      (row) => tree.has(row.parentId) && !tree.has(row.processId),
    );
    added.forEach((row) => tree.add(row.processId));
    isGrowing = added.length > 0;
  }
  return rows.filter((row) => tree.has(row.processId));
}

export async function processesLeftAfter(options: {
  processes: ProcessRow[];
  waitMilliseconds: number;
}): Promise<string[]> {
  await delay(options.waitMilliseconds);
  const alive = new Set((await processRows()).map((row) => row.processId));
  const left = options.processes.filter((row) => alive.has(row.processId));
  left.forEach((row) => {
    process.kill(row.processId, "SIGKILL");
  });
  return left.map((row) => row.command);
}
