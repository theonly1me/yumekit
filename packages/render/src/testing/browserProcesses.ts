import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function browserProcessIds(): Promise<number[]> {
  const { stdout } = await run("ps", ["-axo", "pid=,ppid=,command="]);
  const rows = stdout
    .trim()
    .split("\n")
    .flatMap((line) => {
      const match = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
      const [, processId, parentId, command] = match ?? [];
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
  return rows
    .filter(
      (row) =>
        row.parentId === process.pid &&
        /chrom|headless_shell/i.test(row.command),
    )
    .map((row) => row.processId);
}
