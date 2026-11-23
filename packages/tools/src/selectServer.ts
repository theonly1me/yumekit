import type { MediaDefault } from "./configuration.js";
import type { ServerConnection, StartedServer } from "./connectServer.js";
import { firstReadyServer } from "./serverOrder.js";
import type {
  Capability,
  MediaModelChoice,
  MediaToolFailure,
  Outcome,
} from "./types.js";

export interface SelectedServer {
  connection: StartedServer;
  model?: string;
}

export type MediaDefaults = Partial<Record<Capability, MediaDefault>>;

export function isStarted(
  connection: ServerConnection,
): connection is StartedServer {
  return connection.status === "started";
}

function withModel(options: {
  connection: StartedServer;
  request: MediaModelChoice;
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

function namedServer(options: {
  connections: ServerConnection[];
  name: string;
  capability: Capability;
}): Outcome<StartedServer, MediaToolFailure> {
  const { name, capability } = options;
  const connection = options.connections.find(
    (candidate) => candidate.name === name,
  );
  if (!connection) {
    return { ok: false, failure: { kind: "server-not-found", server: name } };
  }
  if (connection.status === "failed") {
    return {
      ok: false,
      failure: {
        kind: "server-failed-to-start",
        server: name,
        message: connection.message,
      },
    };
  }
  if (!connection.capabilities.includes(capability)) {
    return {
      ok: false,
      failure: { kind: "no-server-for-capability", capability, server: name },
    };
  }
  return { ok: true, value: connection };
}

function speechServerWithAlign(options: {
  connections: ServerConnection[];
  defaults: MediaDefaults;
}): StartedServer | undefined {
  const speechServer = options.defaults.speech?.server;
  return options.connections
    .filter(isStarted)
    .find(
      (connection) =>
        connection.name === speechServer &&
        connection.capabilities.includes("align"),
    );
}

export async function serverWithNoPick(options: {
  connections: ServerConnection[];
  defaults: MediaDefaults;
  capability: Capability;
}): Promise<Outcome<StartedServer, MediaToolFailure>> {
  const followed =
    options.capability === "align" ? speechServerWithAlign(options) : undefined;
  if (followed) return { ok: true, value: followed };
  return firstReadyServer({
    connections: options.connections.filter(isStarted),
    capability: options.capability,
  });
}

export async function selectServer(options: {
  connections: ServerConnection[];
  defaults: MediaDefaults;
  request: MediaModelChoice;
}): Promise<Outcome<SelectedServer, MediaToolFailure>> {
  const { request, connections } = options;
  const { capability } = request;
  const configuredDefault = options.defaults[capability];
  const requested = request.server ?? configuredDefault?.server;
  const selected =
    requested === undefined
      ? await serverWithNoPick({
          connections,
          defaults: options.defaults,
          capability,
        })
      : namedServer({ connections, name: requested, capability });
  if (!selected.ok) return selected;
  return {
    ok: true,
    value: withModel({
      connection: selected.value,
      request,
      configuredDefault,
    }),
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
