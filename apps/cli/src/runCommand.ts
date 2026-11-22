import { usage, usageError, type CommandResult } from "./commandResult.js";
import { agentCommand } from "./commands/agent/agentCommand.js";
import { doctorCommand } from "./commands/doctor/doctorCommand.js";
import { initCommand } from "./commands/initCommand.js";
import { keysCommand } from "./commands/keys/keysCommand.js";
import { mcpCommand } from "./commands/mcpCommand.js";
import { openCommand } from "./commands/open/openCommand.js";
import { frameCommand, renderCommand } from "./commands/renderCommands.js";
import { setupCommand } from "./commands/setupCommand.js";
import { formatVersion, version } from "./index.js";

const commands: Record<string, (args: string[]) => Promise<CommandResult>> = {
  init: initCommand,
  mcp: mcpCommand,
  render: renderCommand,
  frame: frameCommand,
  keys: keysCommand,
  open: openCommand,
  agent: agentCommand,
  doctor: doctorCommand,
  setup: setupCommand,
};

export function runCommand(args: string[]): Promise<CommandResult> {
  const [name, ...rest] = args;
  if (name === "--version") {
    return Promise.resolve({ kind: "done", output: formatVersion(version) });
  }
  if (name === undefined || name === "--help" || name === "help") {
    return Promise.resolve({ kind: "done", output: usage });
  }
  const command = commands[name];
  return command === undefined
    ? Promise.resolve(usageError(`Unknown command "${name}".`))
    : command(rest);
}
