import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { capabilitiesOfTools, describeToolName } from "./convention.js";
import { describeServer, type DescriptionRead } from "./describeServer.js";
import { errorMessage } from "./errorMessage.js";
import { keyValuesOf } from "./keys/index.js";
import type { KeyValues } from "./keys/keyFile.js";
import type { Capability, ServerCommand } from "./types.js";

export type StartedServer = {
  name: string;
  status: "started";
  client: Client;
  command: ServerCommand;
  capabilities: Capability[];
  toolNames: string[];
  passedEnvironment: KeyValues;
} & DescriptionRead;

export type ServerConnection =
  StartedServer | { name: string; status: "failed"; message: string };

export function passedEnvironmentOf(
  command: ServerCommand,
): Promise<KeyValues> {
  return keyValuesOf({ variables: command.passEnvironment ?? [] });
}

async function listToolNames(client: Client): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await client.listTools(cursor ? { cursor } : {});
    names.push(...page.tools.map((tool) => tool.name));
    cursor = page.nextCursor;
  } while (cursor);
  return names;
}

export async function connectServer(options: {
  name: string;
  command: ServerCommand;
}): Promise<ServerConnection> {
  const { name, command } = options;
  const passedEnvironment = await passedEnvironmentOf(command);
  const client = new Client({ name: "yumekit", version: "0.0.0" });
  const transport = new StdioClientTransport({
    command: command.command,
    args: command.args,
    env: passedEnvironment,
    stderr: "inherit",
  });
  try {
    await client.connect(transport);
    const toolNames = await listToolNames(client);
    const description = toolNames.includes(describeToolName)
      ? await describeServer(client)
      : {};
    return {
      name,
      status: "started",
      client,
      command,
      capabilities: capabilitiesOfTools(toolNames),
      toolNames,
      passedEnvironment,
      ...description,
    };
  } catch (error) {
    await client.close().catch(() => undefined);
    return { name, status: "failed", message: errorMessage(error) };
  }
}

export function hasSameEnvironment(options: {
  passed: KeyValues;
  current: KeyValues;
}): boolean {
  const names = new Set([
    ...Object.keys(options.passed),
    ...Object.keys(options.current),
  ]);
  return [...names].every(
    (name) => options.passed[name] === options.current[name],
  );
}
