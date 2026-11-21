import { execFile } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { parse } from "smol-toml";
import { describe, expect, it, onTestFinished } from "vitest";
import { z } from "zod";
import { builtMainFile, createCliWorkspace } from "../../testing/runCli.js";

const runFile = promisify(execFile);

const entrySchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
});

const jsonFileSchema = z.object({
  mcpServers: z.object({ yumekit: entrySchema }),
});

const tomlFileSchema = z.object({
  mcp_servers: z.object({ yumekit: entrySchema }),
});

async function connectedProject() {
  const workspace = await createCliWorkspace();
  const folder = join(workspace.root, "project");
  await workspace.run(["init", folder]);
  return { workspace, folder: await realpath(folder) };
}

async function entryOf(options: { folder: string; agent: string }) {
  if (options.agent === "codex") {
    const text = await readFile(
      join(options.folder, ".codex", "config.toml"),
      "utf8",
    );
    return tomlFileSchema.parse(parse(text)).mcp_servers.yumekit;
  }
  const file =
    options.agent === "cursor" ? join(".cursor", "mcp.json") : ".mcp.json";
  const text = await readFile(join(options.folder, file), "utf8");
  return jsonFileSchema.parse(JSON.parse(text)).mcpServers.yumekit;
}

async function toolNamesFrom(options: {
  entry: z.infer<typeof entrySchema>;
  environment: NodeJS.ProcessEnv;
}): Promise<string[]> {
  const transport = new StdioClientTransport({
    command: options.entry.command,
    args: options.entry.args,
    env: Object.fromEntries(
      Object.entries(options.environment).flatMap(([name, value]) =>
        value === undefined ? [] : [[name, value]],
      ),
    ),
    stderr: "pipe",
  });
  const client = new Client({ name: "agent-entry-test", version: "0.0.0" });
  await client.connect(transport);
  onTestFinished(() => client.close());
  const { tools } = await client.listTools();
  return tools.map((tool) => tool.name);
}

describe("yumekit agent connect", () => {
  it.each(["claude-code", "codex", "cursor"])(
    "writes a %s entry with full paths, and a process started from the entry answers tools/list",
    async (agent) => {
      const { workspace, folder } = await connectedProject();
      const run = await workspace.run([
        "agent",
        "connect",
        "--agent",
        agent,
        "--project",
        folder,
      ]);
      expect(run.exitCode).toBe(0);
      const entry = await entryOf({ folder, agent });
      expect(entry).toEqual({
        command: process.execPath,
        args: [await realpath(builtMainFile), "mcp", "--project", folder],
      });
      expect(run.stdout).toContain(`cd ${folder} && `);
      const names = await toolNamesFrom({
        entry,
        environment: workspace.environment,
      });
      expect(names).toContain("get_project");
    },
  );

  it("uses the current folder when no --project is given, and says where the entry is", async () => {
    const { workspace, folder } = await connectedProject();
    const { stdout } = await runFile(
      process.execPath,
      [builtMainFile, "agent", "connect", "--agent", "cursor"],
      { cwd: folder, env: workspace.environment },
    );
    expect(stdout).toContain(
      `The entry is in ${join(folder, ".cursor", "mcp.json")}.`,
    );
    expect(stdout).toContain(`cd ${folder} && cursor-agent`);
  });

  it("refuses an agent that is not in the list, and a folder that is not a project", async () => {
    const { workspace } = await connectedProject();
    const unknown = await workspace.run([
      "agent",
      "connect",
      "--agent",
      "gemini",
    ]);
    expect(unknown.exitCode).toBe(2);
    expect(unknown.stderr).toContain(
      "--agent must be one of claude-code, codex, cursor.",
    );
    const notProject = await workspace.run([
      "agent",
      "connect",
      "--agent",
      "codex",
      "--project",
      workspace.root,
    ]);
    expect(notProject.exitCode).toBe(1);
  });
});
