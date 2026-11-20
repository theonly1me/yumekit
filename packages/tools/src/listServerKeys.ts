import {
  readMediaToolsConfiguration,
  type ConfiguredServer,
} from "./configuration.js";
import { connectServer, type ServerConnection } from "./connectServer.js";
import type { MediaServerKey } from "./description.js";
import { readKeyStates, type KeyState } from "./keys/index.js";
import type { ConnectFailure, Outcome, ServerCommand } from "./types.js";

export type ServerKeys =
  | {
      server: string;
      status: "described";
      label: string;
      keys: (MediaServerKey & { source: KeyState["source"] })[];
    }
  | { server: string; status: "not-described" }
  | { server: string; status: "failed"; message: string };

function serversWithEveryBundled(options: {
  configured: ConfiguredServer[];
  bundledServers: Record<string, ServerCommand>;
}): ConfiguredServer[] {
  const names = new Set(options.configured.map((server) => server.name));
  const unnamedBundled = Object.entries(options.bundledServers)
    .filter(([name]) => !names.has(name))
    .map(([name, command]): ConfiguredServer => ({
      name,
      status: "ready",
      command,
    }));
  return [...options.configured, ...unnamedBundled];
}

async function keysOf(connection: ServerConnection): Promise<ServerKeys> {
  const server = connection.name;
  if (connection.status === "failed") {
    return { server, status: "failed", message: connection.message };
  }
  await connection.client.close();
  const { description } = connection;
  if (!description) return { server, status: "not-described" };
  const states = await readKeyStates({
    variables: description.keys.map((key) => key.variable),
  });
  return {
    server,
    status: "described",
    label: description.label,
    keys: description.keys.map((key) => ({
      ...key,
      source:
        states.find((state) => state.variable === key.variable)?.source ??
        "missing",
    })),
  };
}

export async function listServerKeys(options: {
  bundledServers: Record<string, ServerCommand>;
}): Promise<Outcome<ServerKeys[], ConnectFailure>> {
  const configuration = await readMediaToolsConfiguration({
    projectFolder: undefined,
    bundledServers: options.bundledServers,
  });
  if (!configuration.ok) return configuration;
  const servers = serversWithEveryBundled({
    configured: configuration.value.servers,
    bundledServers: options.bundledServers,
  });
  const connections = await Promise.all(
    servers.map((server) =>
      server.status === "ready"
        ? connectServer({ name: server.name, command: server.command })
        : Promise.resolve<ServerConnection>({
            name: server.name,
            status: "failed",
            message: server.message,
          }),
    ),
  );
  return { ok: true, value: await Promise.all(connections.map(keysOf)) };
}
