import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { capabilitiesOfTools } from "./convention.js";
import { errorMessage } from "./errorMessage.js";
import type { Capability, ServerCommand } from "./types.js";

export type ServerConnection =
  | {
      name: string;
      status: "started";
      client: Client;
      capabilities: Capability[];
    }
  | { name: string; status: "failed"; message: string };

function passedEnvironment(names: string[]): Record<string, string> {
  const environment: Record<string, string> = {};
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined) environment[name] = value;
  }
  return environment;
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
  const client = new Client({ name: "yumekit", version: "0.0.0" });
  const transport = new StdioClientTransport({
    command: command.command,
    args: command.args,
    env: passedEnvironment(command.passEnvironment ?? []),
    stderr: "inherit",
  });
  try {
    await client.connect(transport);
    const toolNames = await listToolNames(client);
    return {
      name,
      status: "started",
      client,
      capabilities: capabilitiesOfTools(toolNames),
    };
  } catch (error) {
    await client.close().catch(() => undefined);
    return { name, status: "failed", message: errorMessage(error) };
  }
}
