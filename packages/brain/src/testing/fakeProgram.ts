import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { onTestFinished, vi } from "vitest";
import { z } from "zod";

export interface FakeScenario {
  lines: string[];
  exitCode?: number;
  untilInterrupt?: { lines: string[]; exitCode: number };
  ignoresInterrupt?: boolean;
  signedIn?: boolean;
}

export interface FakeProgram {
  programPath: string;
  workingFolder: string;
  readRun: () => Promise<{ arguments: string[]; folder: string }>;
}

const fakeAgentFile = fileURLToPath(new URL("./fakeAgent.ts", import.meta.url));

const runSchema = z.object({
  arguments: z.array(z.string()),
  folder: z.string(),
});

export async function createFakeProgram(
  scenario: FakeScenario,
): Promise<FakeProgram> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-fake-agent-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const scenarioFile = join(root, "scenario.json");
  await writeFile(
    scenarioFile,
    JSON.stringify({ exitCode: 0, signedIn: true, ...scenario }),
  );
  vi.stubEnv("YUMEKIT_FAKE_SCENARIO", scenarioFile);
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  const programPath = join(root, "agent");
  await writeFile(
    programPath,
    `#!/bin/sh\nexec "${process.execPath}" "${fakeAgentFile}" "$@"\n`,
  );
  await chmod(programPath, 0o755);
  const workingFolder = join(root, "work");
  await mkdir(workingFolder);
  return {
    programPath,
    workingFolder,
    readRun: async () =>
      runSchema.parse(
        JSON.parse(await readFile(`${scenarioFile}.arguments.json`, "utf8")),
      ),
  };
}
