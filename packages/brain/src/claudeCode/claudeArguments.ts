import { serverName, type ServerCommand } from "../brainTypes.js";

export const claudeServerToolPrefix = `mcp__${serverName}__`;

export function claudeArgumentsOf(options: {
  request: string;
  sessionId: string | undefined;
  instructionsFile: string;
  serverCommand: ServerCommand;
}): string[] {
  const serverConfiguration = {
    mcpServers: {
      [serverName]: {
        type: "stdio",
        command: options.serverCommand.command,
        args: options.serverCommand.args,
      },
    },
  };
  return [
    "-p",
    ...["--output-format", "stream-json"],
    "--verbose",
    "--include-partial-messages",
    ...["--mcp-config", JSON.stringify(serverConfiguration)],
    "--strict-mcp-config",
    ...["--tools", ""],
    ...["--allowedTools", `${claudeServerToolPrefix}*`],
    ...["--permission-mode", "dontAsk"],
    ...["--setting-sources", ""],
    ...["--append-system-prompt-file", options.instructionsFile],
    ...(options.sessionId === undefined ? [] : ["--resume", options.sessionId]),
    "--",
    options.request,
  ];
}
