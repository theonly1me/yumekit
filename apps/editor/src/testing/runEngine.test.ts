import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { z } from "zod";
import { engineRequest } from "./mediaTestTools.js";
import { runEngine } from "./runEngine.js";

const agentProgramNames = ["claude", "codex", "cursor-agent"];

const agentsSchema = z.object({
  agents: z.array(z.object({ id: z.string(), installed: z.boolean() })),
});

const chatSchema = z.object({ agent: z.unknown() });

async function plantAgentProgramsOnThePath(): Promise<{
  ranFolder: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-planted-agents-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const programFolder = join(root, "bin");
  const ranFolder = join(root, "ran");
  await mkdir(programFolder);
  await mkdir(ranFolder);
  for (const program of agentProgramNames) {
    const file = join(programFolder, program);
    await writeFile(file, `#!/bin/sh\ntouch "${join(ranFolder, program)}"\n`);
    await chmod(file, 0o755);
  }
  vi.stubEnv(
    "PATH",
    [programFolder, process.env["PATH"] ?? ""].join(delimiter),
  );
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  return { ranFolder };
}

describe("the test engine", { timeout: 60_000 }, () => {
  it("finds no claude, codex, or cursor-agent of the computer, and a request starts none of them", async () => {
    const { ranFolder } = await plantAgentProgramsOnThePath();
    const engine = await runEngine();
    onTestFinished(() => engine.remove());

    const { agents } = agentsSchema.parse(
      await engineRequest({ engine, path: "/api/agents" }),
    );
    const chat = chatSchema.parse(
      await engineRequest({ engine, path: "/api/chat" }),
    );
    const request = await engineRequest({
      engine,
      path: "/api/chat/requests",
      method: "POST",
      body: { text: "Make a short film about a ferry." },
    });

    expect(
      agents.map((agent) => `${agent.id}: ${String(agent.installed)}`),
    ).toEqual(["claude-code: false", "codex: false", "cursor: false"]);
    expect(chat.agent).toBeNull();
    expect(request).toMatchObject({ kind: "no-agent" });
    expect(await readdir(ranFolder)).toEqual([]);
  });
});
