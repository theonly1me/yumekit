import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { installCheckEnvironment } from "./checkEnvironment.ts";
import { runProgram } from "./processes.ts";

const agentPrograms = ["claude", "codex", "cursor-agent"];

async function computerWithAgentsAndKeys(root: string) {
  const agentFolder = join(root, "agents");
  await mkdir(agentFolder);
  for (const program of agentPrograms) {
    await writeFile(join(agentFolder, program), "#!/bin/sh\n");
    await chmod(join(agentFolder, program), 0o755);
  }
  return {
    ...process.env,
    PATH: [agentFolder, process.env["PATH"] ?? ""].join(delimiter),
    FAL_KEY: "made-up-fal-key",
    OPENAI_API_KEY: "made-up-openai-key",
    SAND_API_KEY: "made-up-sand-key",
    YUMEKIT_CODEX_PATH: join(agentFolder, "codex"),
    CODEX_HOME: join(root, "codex-home"),
  };
}

describe("the environment of the install check", () => {
  it("finds no claude, codex, or cursor-agent of the computer and passes no media key, so the check reaches only the sample server", async () => {
    const root = await mkdtemp(join(tmpdir(), "yumekit-install-environment-"));
    onTestFinished(() => rm(root, { recursive: true, force: true }));
    const folder = join(root, "check");
    await mkdir(folder);

    const environment = await installCheckEnvironment({
      folder,
      environment: await computerWithAgentsAndKeys(root),
    });
    const found = await runProgram({
      command: "/bin/sh",
      args: [
        "-c",
        'for program in claude codex cursor-agent node npm; do command -v "$program" || echo "no $program"; done',
      ],
      cwd: root,
      environment,
    });

    expect(found.stdout.trim().split("\n")).toEqual([
      "no claude",
      "no codex",
      "no cursor-agent",
      join(folder, "programs", "node"),
      join(folder, "programs", "npm"),
    ]);
    expect(environment).not.toHaveProperty("FAL_KEY");
    expect(environment).not.toHaveProperty("OPENAI_API_KEY");
    expect(environment).not.toHaveProperty("SAND_API_KEY");
    expect(environment).not.toHaveProperty("YUMEKIT_CODEX_PATH");
    expect(environment).not.toHaveProperty("CODEX_HOME");
    expect(environment["YUMEKIT_CONFIG_DIRECTORY"]).toBe(
      join(folder, "config"),
    );
  });
});
