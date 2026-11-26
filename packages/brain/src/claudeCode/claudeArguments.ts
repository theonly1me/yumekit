import {
  serverName,
  type ModelChoice,
  type RunAccess,
  type ServerCommand,
} from "../brainTypes.js";
import { claudeAccessArgumentsOf } from "./claudeAccess.js";

export function claudeArgumentsOf(options: {
  request: string;
  sessionId: string | undefined;
  instructionsFile: string;
  serverCommand: ServerCommand;
  choice: ModelChoice | undefined;
  access: RunAccess | undefined;
}): string[] {
  const { model, effort } = options.choice ?? {};
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
    ...claudeAccessArgumentsOf(options.access),
    ...["--append-system-prompt-file", options.instructionsFile],
    ...(model === undefined ? [] : ["--model", model]),
    ...(effort === undefined ? [] : ["--effort", effort]),
    ...(options.sessionId === undefined ? [] : ["--resume", options.sessionId]),
    "--",
    options.request,
  ];
}
