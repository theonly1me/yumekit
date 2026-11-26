import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { createCliWorkspace, builtMainFile } from "../testing/runCli.js";
import { runOpen } from "../testing/runOpen.js";
import {
  browsersPath,
  processesLeftAfter,
  processesStartedBy,
} from "../testing/processTree.js";

async function startMcpWithPicture() {
  const workspace = await createCliWorkspace();
  workspace.environment["PLAYWRIGHT_BROWSERS_PATH"] = browsersPath();
  const folder = join(workspace.root, "project");
  await workspace.run(["init", folder]);
  const child = spawn(
    process.execPath,
    [builtMainFile, "mcp", "--project", folder],
    {
      env: workspace.environment,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  const send = (message: object) => {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);
  };
  const answerOf = async (id: number): Promise<string> => {
    for (let attempt = 0; attempt < 1200; attempt += 1) {
      const line = output
        .split("\n")
        .find((text) => text.includes(`"id":${String(id)}`));
      if (line !== undefined) return line;
      await delay(50);
    }
    throw new Error(`No answer ${String(id)}: ${output}`);
  };
  send({
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "1" },
    },
  });
  await answerOf(1);
  send({ method: "notifications/initialized" });
  send({
    id: 2,
    method: "tools/call",
    params: {
      name: "put_scene",
      arguments: {
        scene_id: "tea",
        title: "Tea",
        kit_component: "title-card",
        props: { heading: "Tea" },
      },
    },
  });
  await answerOf(2);
  send({
    id: 3,
    method: "tools/call",
    params: {
      name: "preview_scenes",
      arguments: { output_id: "wide", scene_ids: ["tea"] },
    },
  });
  const picture = await answerOf(3);
  const exited = new Promise<number | null>((resolve) => {
    child.on("exit", (code) => {
      resolve(code);
    });
  });
  return { child, picture, exited };
}

describe("the end of yumekit mcp", () => {
  it("ends after its close at the end of its input, and leaves no process of it 5 seconds later", async () => {
    const { child, picture, exited } = await startMcpWithPicture();
    const started = await processesStartedBy(child.pid ?? 0);

    child.stdin.end();
    const exitCode = await exited;
    const left = await processesLeftAfter({
      processes: started,
      waitMilliseconds: 5000,
    });

    expect(picture).toContain('"type":"image"');
    expect(
      started.some((row) => /chrom|headless_shell/i.test(row.command)),
    ).toBe(true);
    expect(exitCode).toBe(0);
    expect(left).toEqual([]);
  }, 120_000);

  it("ends after its close on SIGTERM, and leaves no process of it 5 seconds later", async () => {
    const { child, exited } = await startMcpWithPicture();
    const started = await processesStartedBy(child.pid ?? 0);

    child.kill("SIGTERM");
    const exitCode = await exited;
    const left = await processesLeftAfter({
      processes: started,
      waitMilliseconds: 5000,
    });

    expect(exitCode).toBe(0);
    expect(left).toEqual([]);
  }, 120_000);

  it("ends as a bridge at the end of its input", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder]);
    await runOpen({ folder, environment: workspace.environment });
    const bridge = spawn(
      process.execPath,
      [builtMainFile, "mcp", "--project", folder],
      { env: workspace.environment, stdio: ["pipe", "pipe", "pipe"] },
    );
    const exited = new Promise((resolve) => bridge.on("exit", resolve));
    const answered = new Promise((resolve) =>
      bridge.stdout.once("data", resolve),
    );
    bridge.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } })}\n`,
    );
    await answered;

    bridge.stdin.end();
    const ended = await Promise.race([
      exited.then(() => true),
      delay(5000).then(() => false),
    ]);
    if (!ended) bridge.kill("SIGKILL");

    expect(ended).toBe(true);
  }, 120_000);
});
