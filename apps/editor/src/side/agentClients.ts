export interface AgentClient {
  id: string;
  name: string;
  where: string;
  configuration: (projectFolder: string) => string;
}

function serverArguments(projectFolder: string): string {
  const values = ["mcp", "--project", projectFolder].map((value) =>
    JSON.stringify(value),
  );
  return `[${values.join(", ")}]`;
}

function jsonConfiguration(options: {
  projectFolder: string;
  withType: boolean;
}): string {
  const server = {
    ...(options.withType ? { type: "stdio" } : {}),
    command: "yumekit",
    args: ["mcp", "--project", options.projectFolder],
  };
  return JSON.stringify({ mcpServers: { yumekit: server } }, null, 2);
}

export function shellQuoted(text: string): string {
  return /^[\w./-]+$/.test(text) ? text : `'${text.replaceAll("'", "'\\''")}'`;
}

export function mcpCommandOf(projectFolder: string): string {
  return `yumekit mcp --project ${shellQuoted(projectFolder)}`;
}

export const agentClients: AgentClient[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    where:
      "Put this in .mcp.json in the folder where you start Claude Code. Claude Code asks you to approve the server once.",
    configuration: (projectFolder) =>
      jsonConfiguration({ projectFolder, withType: false }),
  },
  {
    id: "codex",
    name: "Codex",
    where: "Add this to ~/.codex/config.toml.",
    configuration: (projectFolder) =>
      [
        "[mcp_servers.yumekit]",
        'command = "yumekit"',
        `args = ${serverArguments(projectFolder)}`,
      ].join("\n"),
  },
  {
    id: "cursor",
    name: "Cursor",
    where:
      "Put this in .cursor/mcp.json in your project, or in ~/.cursor/mcp.json for every project.",
    configuration: (projectFolder) =>
      jsonConfiguration({ projectFolder, withType: true }),
  },
];
