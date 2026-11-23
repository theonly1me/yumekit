import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";

export type FakeStep =
  | { print: string }
  | { callTool: { name: string; input: object; saveResultTo?: string } }
  | { waitForStop: { print: string[] } }
  | { waitForFile: string };

export interface FakeAgentScenario {
  steps: FakeStep[];
  helperSteps?: FakeStep[];
  exitCode?: number;
  signedIn?: boolean;
  resumeFails?: boolean;
}

const fakeAgentFile = fileURLToPath(new URL("./fakeAgent.ts", import.meta.url));

export async function installFakeAgent(options: {
  folder: string;
  scenario: FakeAgentScenario;
}) {
  await mkdir(options.folder, { recursive: true });
  const scenarioFile = join(options.folder, "scenario.json");
  const writeScenario = (next: FakeAgentScenario) =>
    writeFile(
      scenarioFile,
      JSON.stringify({
        exitCode: 0,
        signedIn: true,
        resumeFails: false,
        ...next,
      }),
    );
  await writeScenario(options.scenario);
  vi.stubEnv("YUMEKIT_FAKE_AGENT_SCENARIO", scenarioFile);
  vi.stubEnv("PATH", options.folder);
  const programPath = join(options.folder, "claude");
  await writeFile(
    programPath,
    `#!/bin/sh\nexec "${process.execPath}" "${fakeAgentFile}" "$@"\n`,
  );
  await chmod(programPath, 0o755);
  return { programPath, scenarioFile, writeScenario };
}
