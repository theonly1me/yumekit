import { callCheckKey } from "./checkKey.js";
import { readMediaToolsConfiguration } from "./configuration.js";
import {
  connectServer,
  type ServerConnection,
  type StartedServer,
} from "./connectServer.js";
import { runTool } from "./runTool.js";
import {
  describedDefaultModel,
  isStarted,
  selectServer,
} from "./selectServer.js";
import { createServerPool, missingKeyFailureOf } from "./serverPool.js";
import type {
  ConnectFailure,
  MediaServerEntry,
  MediaTools,
  Outcome,
  ServerCommand,
} from "./types.js";

const defaultToolTimeoutSeconds = 600;

function entryOf(connection: StartedServer): MediaServerEntry {
  return {
    server: connection.name,
    capabilities: [...connection.capabilities],
    ...(connection.description ? { description: connection.description } : {}),
    ...(connection.descriptionFailure
      ? { descriptionFailure: connection.descriptionFailure }
      : {}),
  };
}

export async function connectMediaTools(options: {
  projectFolder: string;
  bundledServers: Record<string, ServerCommand>;
  toolTimeoutSeconds?: number;
}): Promise<Outcome<MediaTools, ConnectFailure>> {
  const configurationRead = await readMediaToolsConfiguration(options);
  if (!configurationRead.ok) return configurationRead;
  const configuration = configurationRead.value;
  const toolTimeoutSeconds =
    options.toolTimeoutSeconds ?? defaultToolTimeoutSeconds;
  const pool = createServerPool(
    await Promise.all(
      configuration.servers.map((server) =>
        server.status === "ready"
          ? connectServer({ name: server.name, command: server.command })
          : Promise.resolve<ServerConnection>({
              name: server.name,
              status: "failed",
              message: server.message,
            }),
      ),
    ),
  );
  const tools: MediaTools = {
    list: () => pool.connections().filter(isStarted).map(entryOf),
    failedServers: () =>
      pool
        .connections()
        .filter((connection) => connection.status === "failed")
        .map((connection) => ({
          server: connection.name,
          message: connection.message,
        })),
    limits: () => ({ ...configuration.limits }),
    run: async (request) => {
      const selected = selectServer({
        connections: pool.connections(),
        defaults: configuration.defaults,
        request,
      });
      if (!selected.ok) return selected;
      const missingKey = await missingKeyFailureOf(selected.value.connection);
      if (missingKey) return { ok: false, failure: missingKey };
      const refreshed = await pool.refresh(selected.value.connection);
      if (!refreshed.ok) return refreshed;
      const connection = refreshed.value;
      const { model } = selected.value;
      const ran = await runTool({
        server: connection.name,
        client: connection.client,
        request,
        model,
        toolTimeoutSeconds,
      });
      if (!ran.ok) return ran;
      const recordedModel =
        model ??
        describedDefaultModel({ connection, capability: request.capability });
      return {
        ok: true,
        value: {
          server: connection.name,
          ...(recordedModel === undefined ? {} : { model: recordedModel }),
          result: ran.value,
        },
      };
    },
    checkKey: async (server) => {
      const connection = pool
        .connections()
        .find((candidate) => candidate.name === server);
      if (!connection) {
        return { ok: false, failure: { kind: "server-not-found", server } };
      }
      if (connection.status === "failed") {
        return {
          ok: false,
          failure: {
            kind: "server-failed-to-start",
            server,
            message: connection.message,
          },
        };
      }
      const refreshed = await pool.refresh(connection);
      if (!refreshed.ok) return refreshed;
      return callCheckKey({ connection: refreshed.value, toolTimeoutSeconds });
    },
    close: () => pool.close(),
  };
  return { ok: true, value: tools };
}
