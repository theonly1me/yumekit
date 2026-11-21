import type { MediaDefault } from "./configuration.js";
import type { ServerConnection, StartedServer } from "./connectServer.js";
import type {
  Capability,
  MediaToolFailure,
  MediaToolRequest,
  Outcome,
} from "./types.js";

export interface SelectedServer {
  connection: StartedServer;
  model?: string;
}

export function isStarted(
  connection: ServerConnection,
): connection is StartedServer {
  return connection.status === "started";
}

function withModel(options: {
  connection: StartedServer;
  request: MediaToolRequest;
  configuredDefault: MediaDefault | undefined;
}): SelectedServer {
  const { connection, request, configuredDefault } = options;
  const defaultModel =
    configuredDefault?.server === connection.name
      ? configuredDefault.model
      : undefined;
  const model = request.model ?? defaultModel;
  return model === undefined ? { connection } : { connection, model };
}

export function selectServer(options: {
  connections: ServerConnection[];
  defaults: Partial<Record<Capability, MediaDefault>>;
  request: MediaToolRequest;
}): Outcome<SelectedServer, MediaToolFailure> {
  const { request } = options;
  const { capability } = request;
  const configuredDefault = options.defaults[capability];
  const requested = request.server ?? configuredDefault?.server;
  if (requested === undefined) {
    const first = options.connections
      .filter(isStarted)
      .find((connection) => connection.capabilities.includes(capability));
    return first
      ? {
          ok: true,
          value: withModel({ connection: first, request, configuredDefault }),
        }
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
  return {
    ok: true,
    value: withModel({ connection, request, configuredDefault }),
  };
}

export function describedDefaultModel(options: {
  connection: StartedServer;
  capability: Capability;
}): string | undefined {
  return options.connection.description?.models.find(
    (model) => model.capability === options.capability && model.is_default,
  )?.id;
}
