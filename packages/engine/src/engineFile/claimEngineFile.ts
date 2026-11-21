import { rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import type { EngineFailure, Outcome } from "../engineTypes.js";
import { isSameToken } from "../http/requestChecks.js";
import {
  createEngineFileExclusively,
  engineFilePathOf,
  readEngineFile,
  type EngineFileContent,
} from "./engineFile.js";
import { findRunningEngine, type RunningEngine } from "./findRunningEngine.js";

const readAttempts = 3;
const readWaitMilliseconds = 100;

async function runningEngineOf(
  projectFolder: string,
): Promise<RunningEngine | undefined> {
  for (let attempt = 1; attempt <= readAttempts; attempt += 1) {
    const running = await findRunningEngine(projectFolder);
    if (running !== undefined) return running;
    if (attempt < readAttempts) await delay(readWaitMilliseconds);
  }
  return undefined;
}

function isSameContent(options: {
  seen: EngineFileContent | undefined;
  current: EngineFileContent | undefined;
}): boolean {
  const { seen, current } = options;
  if (seen === undefined || current === undefined) {
    return seen === current;
  }
  return isSameToken({ given: current.token, token: seen.token });
}

async function removeStaleFile(options: {
  projectFolder: string;
  seen: EngineFileContent | undefined;
}): Promise<void> {
  const current = await readEngineFile(options.projectFolder);
  if (!isSameContent({ seen: options.seen, current })) return;
  await rm(engineFilePathOf(options.projectFolder), { force: true });
}

export async function claimEngineFile(options: {
  projectFolder: string;
  content: EngineFileContent;
}): Promise<Outcome<undefined, EngineFailure>> {
  const { projectFolder } = options;
  if (await createEngineFileExclusively(options)) {
    return { ok: true, value: undefined };
  }
  const seen = await readEngineFile(projectFolder);
  const running = await runningEngineOf(projectFolder);
  if (running !== undefined) {
    return {
      ok: false,
      failure: { kind: "engine-already-running", url: running.url },
    };
  }
  await removeStaleFile({ projectFolder, seen });
  if (await createEngineFileExclusively(options)) {
    return { ok: true, value: undefined };
  }
  const winner = await runningEngineOf(projectFolder);
  return {
    ok: false,
    failure:
      winner === undefined
        ? {
            kind: "project-invalid",
            message: `Another engine is starting for this project. Remove ${engineFilePathOf(projectFolder)} if no engine runs.`,
          }
        : { kind: "engine-already-running", url: winner.url },
  };
}
