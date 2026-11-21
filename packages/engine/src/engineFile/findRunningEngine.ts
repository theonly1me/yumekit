import { realpath } from "node:fs/promises";
import { z } from "zod";
import { readEngineFile } from "./engineFile.js";

export interface RunningEngine {
  url: string;
  origin: string;
  token: string;
}

const healthSchema = z.object({
  name: z.literal("yumekit"),
  projectFolder: z.string(),
});

const healthWaitMilliseconds = 2_000;

export function engineUrlOf(options: { port: number; token: string }): {
  url: string;
  origin: string;
} {
  const origin = `http://127.0.0.1:${String(options.port)}`;
  return { origin, url: `${origin}/?token=${options.token}` };
}

async function answersHealth(options: {
  origin: string;
  token: string;
  projectFolder: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${options.origin}/api/health`, {
      headers: { Authorization: `Bearer ${options.token}` },
      signal: AbortSignal.timeout(healthWaitMilliseconds),
    });
    if (response.status !== 200) return false;
    const health = healthSchema.safeParse(await response.json());
    return (
      health.success && health.data.projectFolder === options.projectFolder
    );
  } catch {
    return false;
  }
}

export async function findRunningEngine(
  projectFolder: string,
): Promise<RunningEngine | undefined> {
  const content = await readEngineFile(projectFolder);
  if (content === undefined) return undefined;
  const address = engineUrlOf(content);
  const isRunning = await answersHealth({
    origin: address.origin,
    token: content.token,
    projectFolder: await realpath(projectFolder),
  });
  return isRunning ? { ...address, token: content.token } : undefined;
}
