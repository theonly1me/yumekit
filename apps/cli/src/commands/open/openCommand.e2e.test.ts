import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createCliWorkspace } from "../../testing/runCli.js";
import { runOpen } from "../../testing/runOpen.js";

const runFile = promisify(execFile);

async function childrenOf(processId: number): Promise<number[]> {
  try {
    const { stdout } = await runFile("pgrep", ["-P", String(processId)]);
    return stdout.split("\n").filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

async function isRunning(processId: number): Promise<boolean> {
  try {
    await runFile("ps", ["-p", String(processId)]);
    return true;
  } catch {
    return false;
  }
}

async function isPresent(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("yumekit open", () => {
  it("starts the engine, prints the URL, and serves the health request with the token", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder]);

    const open = await runOpen({ folder, environment: workspace.environment });
    const health = await fetch(`${open.origin}/api/health`, {
      headers: { authorization: `Bearer ${open.token}` },
    });
    const page = await fetch(open.url);

    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ name: "yumekit" });
    expect(page.status).toBe(200);
    expect(await isPresent(join(folder, ".yumekit", "engine.json"))).toBe(true);
  });

  it("prints the URL of the running engine and exits when an engine already runs for the folder", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder]);
    const open = await runOpen({ folder, environment: workspace.environment });

    const second = await workspace.run(["open", folder, "--no-browser"]);

    expect(second.exitCode).toBe(0);
    expect(second.stdout).toContain(open.url);
  });

  it("closes the engine on SIGTERM, removes engine.json, and leaves no child process", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder]);
    const open = await runOpen({ folder, environment: workspace.environment });
    const children = await childrenOf(open.processId);

    const exitCode = await open.stop();
    const stillRunning = await Promise.all(children.map(isRunning));

    expect(children.length).toBeGreaterThan(0);
    expect(exitCode).toBe(0);
    expect(open.output()).toContain("the engine stopped");
    expect(await isPresent(join(folder, ".yumekit", "engine.json"))).toBe(
      false,
    );
    expect(stillRunning).toEqual(children.map(() => false));
  });

  it("fails with a message for a folder that is not a project", async () => {
    const workspace = await createCliWorkspace();

    const run = await workspace.run([
      "open",
      join(workspace.root, "nothing"),
      "--no-browser",
    ]);

    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain("does not exist");
  });

  it("rejects a port that is not a whole number", async () => {
    const workspace = await createCliWorkspace();

    const run = await workspace.run(["open", workspace.root, "--port", "x"]);

    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("--port");
  });
});
