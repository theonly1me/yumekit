import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { leftFoldersFailure } from "./leftFolders.ts";

const vitestEntry = fileURLToPath(
  new URL("../../node_modules/vitest/vitest.mjs", import.meta.url),
);
const passedSignals = ["SIGINT", "SIGTERM"] as const;

const runFolder = await mkdtemp(join(tmpdir(), "yumekit-test-run-"));
const child = spawn(
  process.execPath,
  [vitestEntry, "run", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...process.env, TMPDIR: runFolder, TMP: runFolder, TEMP: runFolder },
  },
);
for (const signal of passedSignals) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
const exitCode = await new Promise<number>((resolve) => {
  child.on("close", (code) => {
    resolve(code ?? 1);
  });
});
const failure = leftFoldersFailure(await readdir(runFolder));
await rm(runFolder, {
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 200,
});
if (failure !== undefined) console.error(`\n${failure}`);
process.exitCode = failure === undefined ? exitCode : 1;
