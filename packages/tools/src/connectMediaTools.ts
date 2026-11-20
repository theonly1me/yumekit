import { readMediaToolsConfiguration } from "./configuration.js";
import { connectServer, type ServerConnection } from "./connectServer.js";
import { runTool } from "./runTool.js";
import type {
  Capability,
  MediaToolFailure,
  MediaToolRequest,
  MediaTools,
  Outcome,
  ServerCommand,
} from "./types.js";

type StartedServer = Extract<ServerConnection, { status: "started" }>;

function isStarted(connection: ServerConnection): connection is StartedServer {
  return connection.status === "started";
}

function selectServer(options: {
  connections: ServerConnection[];
  defaults: Partial<Record<Capability, string>>;
  request: MediaToolRequest;
}): Outcome<StartedServer, MediaToolFailure> {
  const { capability } = options.request;
  const requested = options.request.server ?? options.defaults[capability];
  if (requested === undefined) {
    const first = options.connections
      .filter(isStarted)
      .find((connection) => connection.capabilities.includes(capability));
    return first
      ? { ok: true, value: first }
      : {
          ok: false,
          failure: { kind: "no-server-for-capability", capability },
        };
  }
  const connection = options.connections.find(
    (candidate) => candidate.name === requested,
  );
  if (!connection) {
    return {
      ok: false,
      failure: { kind: "server-not-found", server: requested },
    };
  }
  if (connection.status === "failed") {
    return {
      ok: false,
      failure: {
        kind: "server-failed-to-start",
        server: requested,
        message: connection.message,
      },
    };
  }
  if (!connection.capabilities.includes(capability)) {
    return {
      ok: false,
      failure: {
        kind: "no-server-for-capability",
        capability,
        server: requested,
      },
    };
  }
  return { ok: true, value: connection };
}

export async function connectMediaTools(options: {
  projectFolder: string;
  bundledServers: Record<string, ServerCommand>;
}): Promise<MediaTools> {
  const configuration = await readMediaToolsConfiguration(options);
  const connections = await Promise.all(
    configuration.servers.map((server) =>
      server.status === "ready"
        ? connectServer({ name: server.name, command: server.command })
        : Promise.resolve<ServerConnection>({
            name: server.name,
            status: "failed",
            message: server.message,
          }),
    ),
  );
  const startedServers = connections.filter(isStarted);
  return {
    list: () =>
      startedServers.map((connection) => ({
        server: connection.name,
        capabilities: [...connection.capabilities],
      })),
    run: async (request) => {
      const selected = selectServer({
        connections,
        defaults: configuration.defaults,
        request,
      });
      if (!selected.ok) return selected;
      return runTool({
        server: selected.value.name,
        client: selected.value.client,
        request,
      });
    },
    close: async () => {
      await Promise.all(
        startedServers.map((connection) => connection.client.close()),
      );
    },
  };
}
