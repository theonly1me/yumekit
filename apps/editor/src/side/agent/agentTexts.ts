import type { AgentId, ServerCommand } from "./agentRequests.js";

export function shellQuoted(text: string): string {
  return /^[\w./-]+$/.test(text) ? text : `'${text.replaceAll("'", "'\\''")}'`;
}

export function commandLineOf(words: string[]): string {
  return words.map(shellQuoted).join(" ");
}

export function startLineOf(options: {
  projectFolder: string;
  startCommand: string;
}): string {
  return `cd ${shellQuoted(options.projectFolder)} && ${options.startCommand}`;
}

function yumekitWordsOf(options: {
  serverCommand: ServerCommand;
  projectFolder: string;
}): string[] {
  const { command, args } = options.serverCommand;
  const ending = args.slice(-3);
  const isServerEnding =
    ending.length === 3 &&
    ending[0] === "mcp" &&
    ending[1] === "--project" &&
    ending[2] === options.projectFolder;
  return isServerEnding ? [command, ...args.slice(0, -3)] : ["yumekit"];
}

export function promptOf(options: {
  serverCommand: ServerCommand;
  projectFolder: string;
}): string {
  const yumekit = commandLineOf(yumekitWordsOf(options));
  return [
    "Connect yourself to my yumekit project.",
    "1. Run this command. Use your own name for <agent>: claude-code, codex, or cursor.",
    `   ${yumekit} agent connect --agent <agent> --project ${shellQuoted(options.projectFolder)}`,
    "2. Tell me how to reload your tool servers, or reload them if you can.",
    "3. Then call the yumekit tool get_project and tell me what the project holds.",
  ].join("\n");
}

export const approvalNotes: Record<AgentId, string> = {
  "claude-code": "Claude Code asks you once to approve the yumekit server.",
  codex:
    "Codex reads this file only in a trusted folder. Codex asks you once to trust the folder.",
  cursor: "Cursor asks you once to approve the yumekit server.",
};

function jsonBlockOf(serverCommand: ServerCommand): string {
  const server = { type: "stdio", ...serverCommand };
  return JSON.stringify({ mcpServers: { yumekit: server } }, null, 2);
}

function tomlBlockOf(serverCommand: ServerCommand): string {
  return [
    "[mcp_servers.yumekit]",
    `command = ${JSON.stringify(serverCommand.command)}`,
    `args = [${serverCommand.args.map((argument) => JSON.stringify(argument)).join(", ")}]`,
  ].join("\n");
}

export interface ManualSetup {
  id: AgentId;
  name: string;
  where: string;
  configuration: (serverCommand: ServerCommand) => string;
}

export const manualSetups: ManualSetup[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    where: `Put this in .mcp.json in the project folder. ${approvalNotes["claude-code"]}`,
    configuration: jsonBlockOf,
  },
  {
    id: "codex",
    name: "Codex",
    where: `Put this in .codex/config.toml in the project folder. ${approvalNotes.codex}`,
    configuration: tomlBlockOf,
  },
  {
    id: "cursor",
    name: "Cursor",
    where: `Put this in .cursor/mcp.json in the project folder. ${approvalNotes.cursor}`,
    configuration: jsonBlockOf,
  },
];
