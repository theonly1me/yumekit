import { usage, usageError, type CommandResult } from "./commandResult.js";
import { initCommand } from "./commands/initCommand.js";
import { mcpCommand } from "./commands/mcpCommand.js";
import { frameCommand, renderCommand } from "./commands/renderCommands.js";
import { formatVersion, version } from "./index.js";

const commands: Record<string, (args: string[]) => Promise<CommandResult>> = {
  init: initCommand,
  mcp: mcpCommand,
  render: renderCommand,
  frame: frameCommand,
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
