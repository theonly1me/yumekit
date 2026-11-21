import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parse } from "smol-toml";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { agentIds, connectAgent, listAgents, type AgentId } from "./index.js";

function serverCommandOf(projectFolder: string) {
  return {
    command: "/opt/node folder/bin/node",
    args: ["/opt/yumekit/main.js", "mcp", "--project", projectFolder],
  };
}

const filesOf: Record<AgentId, string> = {
  "claude-code": ".mcp.json",
  codex: join(".codex", "config.toml"),
  cursor: join(".cursor", "mcp.json"),
};

async function temporaryFolder(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-agents-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "home");
  await mkdir(home);
  vi.stubEnv("HOME", home);
  vi.stubEnv("PATH", join(root, "bin"));
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  return root;
}

function entryIn(options: { agentId: AgentId; text: string }): unknown {
  if (options.agentId === "codex") {
    const servers = parse(options.text)["mcp_servers"];
    return typeof servers === "object"
      ? Reflect.get(servers, "yumekit")
      : undefined;
  }
  const json: unknown = JSON.parse(options.text);
  return typeof json === "object" && json !== null
    ? Reflect.get(Reflect.get(json, "mcpServers"), "yumekit")
    : undefined;
}

async function connected(options: { agentId: AgentId; projectFolder: string }) {
  const result = await connectAgent({
    ...options,
    serverCommand: serverCommandOf(options.projectFolder),
  });
  if (!result.ok) throw new Error(result.failure.message);
  return result.value;
}

describe("connectAgent", () => {
  it.each(agentIds)(
    "writes a %s entry in the project folder that the agent format reads, and a second connect changes nothing",
    async (agentId) => {
      const projectFolder = await temporaryFolder();
      const record = await connected({ agentId, projectFolder });
      const file = join(projectFolder, filesOf[agentId]);
      expect(record).toMatchObject({
        id: agentId,
        configured: true,
        configuration_file: file,
      });
      const text = await readFile(file, "utf8");
      expect(entryIn({ agentId, text })).toMatchObject(
        serverCommandOf(projectFolder),
      );
      const { mtimeMs } = await stat(file);
      await connected({ agentId, projectFolder });
      expect(await readFile(file, "utf8")).toBe(text);
      expect((await stat(file)).mtimeMs).toBe(mtimeMs);
    },
  );

  it("keeps the other servers and settings of a JSON file that exists", async () => {
    const projectFolder = await temporaryFolder();
    const file = join(projectFolder, ".mcp.json");
    const other = { command: "other-server", args: ["--fast"] };
    await writeFile(file, JSON.stringify({ mcpServers: { other }, extra: 1 }));
    await connected({ agentId: "claude-code", projectFolder });
    const json: unknown = JSON.parse(await readFile(file, "utf8"));
    expect(json).toMatchObject({ extra: 1, mcpServers: { other } });
  });

  it("keeps the other text of a TOML file and replaces an old yumekit table", async () => {
    const projectFolder = await temporaryFolder();
    const file = join(projectFolder, ".codex", "config.toml");
    await mkdir(dirname(file));
    const head =
      'model = "x"\n\n# my servers\n[mcp_servers.other]\ncommand = "other"\n';
    await writeFile(
      file,
      `${head}\n[mcp_servers.yumekit]\ncommand = "old"\n\n[mcp_servers.yumekit.env]\nA = "1"\n\n[profiles.fast]\nmodel = "y"\n`,
    );
    await connected({ agentId: "codex", projectFolder });
    const text = await readFile(file, "utf8");
    expect(text.startsWith(head)).toBe(true);
    expect(parse(text)).toEqual({
      model: "x",
      mcp_servers: {
        other: { command: "other" },
        yumekit: serverCommandOf(projectFolder),
      },
      profiles: { fast: { model: "y" } },
    });
  });

  it.each([
    { agentId: "claude-code", content: "{ not json" },
    { agentId: "cursor", content: JSON.stringify({ mcpServers: ["a list"] }) },
    { agentId: "codex", content: "[mcp_servers\ncommand =" },
    { agentId: "codex", content: "mcp_servers = 3\n" },
    {
      agentId: "codex",
      content: 'mcp_servers.yumekit = { command = "inline" }\n',
    },
  ] as const)(
    "changes nothing in a $agentId file that it cannot read safely: $content",
    async ({ agentId, content }) => {
      const projectFolder = await temporaryFolder();
      const file = join(projectFolder, filesOf[agentId]);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, content);
      const result = await connectAgent({
        agentId,
        projectFolder,
        serverCommand: serverCommandOf(projectFolder),
      });
      expect(result).toMatchObject({
        ok: false,
        failure: { kind: "configuration-not-valid", file },
      });
      expect(await readFile(file, "utf8")).toBe(content);
    },
  );
});

describe("listAgents", () => {
  it("finds the program of an agent on the PATH and the entry of this project folder only", async () => {
    const root = await temporaryFolder();
    await mkdir(join(root, "bin"));
    await writeFile(join(root, "bin", "codex"), "#!/bin/sh\n");
    await chmod(join(root, "bin", "codex"), 0o755);
    await writeFile(join(root, "bin", "claude"), "not a program");
    const projectFolder = join(root, "project");
    await mkdir(projectFolder);
    await mkdir(join(projectFolder, ".cursor"));
    await writeFile(
      join(projectFolder, ".cursor", "mcp.json"),
      JSON.stringify({
        mcpServers: {
          yumekit: { command: "node", args: ["mcp", "--project", root] },
        },
      }),
    );
    const records = await listAgents({ projectFolder });
    expect(
      records.map(({ id, installed, configured }) => ({
        id,
        installed,
        configured,
      })),
    ).toEqual([
      { id: "claude-code", installed: false, configured: false },
      { id: "codex", installed: true, configured: false },
      { id: "cursor", installed: false, configured: false },
    ]);
  });
});
