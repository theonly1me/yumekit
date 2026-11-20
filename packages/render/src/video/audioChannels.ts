import { execFile } from "node:child_process";
import { promisify } from "node:util";

const runFile = promisify(execFile);

async function channelsOf(file: string): Promise<number | undefined> {
  try {
    const { stdout } = await runFile("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=channels",
      "-of",
      "csv=p=0",
      file,
    ]);
    const channels = Number.parseInt(stdout.trim(), 10);
    return Number.isNaN(channels) ? undefined : channels;
  } catch {
    return undefined;
  }
}

export async function monoFilesOf(files: string[]): Promise<Set<string>> {
  const uniqueFiles = [...new Set(files)];
  const channels = await Promise.all(
    uniqueFiles.map(async (file) => ({
      file,
      channels: await channelsOf(file),
    })),
  );
  return new Set(
    channels.flatMap((probed) => (probed.channels === 1 ? [probed.file] : [])),
  );
}
