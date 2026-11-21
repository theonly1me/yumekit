import {
  agentIds,
  connectAgent,
  isAgentId,
  type AgentRecord,
} from "@yumekit/engine";
import { openProject } from "@yumekit/project";
import { failed, usageError, type CommandResult } from "../../commandResult.js";
import { parseCommandLine, stringOption } from "../../options.js";
import { realFolderOf, serverCommandOf } from "../../serverCommand.js";
import { startLineOf } from "./startLine.js";

const approvalNotes: Record<AgentRecord["id"], string> = {
  "claude-code": "Claude Code asks you once to approve the yumekit server.",
  codex:
    "Codex reads this file only in a trusted folder. Codex asks you once to trust the folder.",
  cursor: "Cursor asks you once to approve the yumekit server.",
};

function connectedText(options: {
  record: AgentRecord;
  projectFolder: string;
}): string {
  const { record } = options;
  return [
    `Connected ${record.name} to this project.`,
    `The entry is in ${record.configuration_file}.`,
    `Next, start ${record.name} in the project folder:`,
    `  ${startLineOf({ projectFolder: options.projectFolder, startCommand: record.start_command })}`,
    `If ${record.name} already runs, reload its MCP servers.`,
    approvalNotes[record.id],
    "",
  ].join("\n");
}

export async function agentCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({
    args,
    config: { agent: { type: "string" }, project: { type: "string" } },
  });
  if (!parsed.ok) return usageError(parsed.message);
  const { values, positionals } = parsed.value;
  if (positionals.length !== 1 || positionals[0] !== "connect") {
    return usageError("agent needs the subcommand connect.");
  }
  const agentId = stringOption({ values, name: "agent" });
  if (agentId === undefined || !isAgentId(agentId)) {
    return usageError(`--agent must be one of ${agentIds.join(", ")}.`);
  }
  const projectFolder = await realFolderOf(
    stringOption({ values, name: "project" }) ?? ".",
  );
  const opened = await openProject({ folder: projectFolder });
  if (!opened.ok) return failed(opened.failure.message);
  const connected = await connectAgent({
    agentId,
    projectFolder,
    serverCommand: serverCommandOf(projectFolder),
  });
  if (!connected.ok) return failed(connected.failure.message);
  return {
    kind: "done",
    output: connectedText({ record: connected.value, projectFolder }),
  };
}
