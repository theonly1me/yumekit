import {
  serverName,
  type ModelChoice,
  type ServerCommand,
} from "../brainTypes.js";

function setting(options: { key: string; value: unknown }): string[] {
  return ["-c", `${options.key}=${JSON.stringify(options.value)}`];
}

function serverSetting(options: { key: string; value: unknown }): string[] {
  return setting({
    key: `mcp_servers.${serverName}.${options.key}`,
    value: options.value,
  });
}

export function codexArgumentsOf(options: {
  request: string;
  sessionId: string | undefined;
  instructions: string;
  serverCommand: ServerCommand;
  choice: ModelChoice | undefined;
}): string[] {
  const { model, effort } = options.choice ?? {};
  const isResume = options.sessionId !== undefined;
  return [
    "exec",
    ...(isResume ? ["resume"] : []),
    "--json",
    "--skip-git-repo-check",
    "--ignore-user-config",
    ...["--disable", "apps"],
    ...["--disable", "plugins"],
    ...["--disable", "shell_tool"],
    ...(isResume
      ? setting({ key: "sandbox_mode", value: "read-only" })
      : ["--sandbox", "read-only"]),
    ...setting({ key: "approval_policy", value: "never" }),
    ...setting({ key: "web_search", value: "disabled" }),
    ...serverSetting({ key: "command", value: options.serverCommand.command }),
    ...serverSetting({ key: "args", value: options.serverCommand.args }),
    ...serverSetting({ key: "default_tools_approval_mode", value: "approve" }),
    ...serverSetting({ key: "required", value: true }),
    ...serverSetting({ key: "supports_parallel_tool_calls", value: true }),
    ...setting({ key: "developer_instructions", value: options.instructions }),
    ...(model === undefined ? [] : setting({ key: "model", value: model })),
    ...(effort === undefined
      ? []
      : setting({ key: "model_reasoning_effort", value: effort })),
    "--",
    ...(options.sessionId === undefined ? [] : [options.sessionId]),
    options.request,
  ];
}
