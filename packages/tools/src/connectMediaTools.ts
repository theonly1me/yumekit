import { checkKeyToolName } from "./convention.js";
import { checkServerKey } from "./checkKey.js";
import { readMediaToolsConfiguration } from "./configuration.js";
import {
  connectServer,
  type ServerConnection,
  type StartedServer,
} from "./connectServer.js";
import { checkPick } from "./checkPick.js";
import { mediaChoicesOf } from "./mediaChoices.js";
import { prepareModel, waitsForDownload } from "./modelDownloads.js";
import { runTool } from "./runTool.js";
import { saveUserDefault } from "./saveUserDefault.js";
import { saveUserVideoLimit } from "./saveUserLimit.js";
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
    canCheckKey: connection.toolNames.includes(checkKeyToolName),
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
  let defaults = configuration.defaults;
  let limits = configuration.limits;
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
  const descriptionListeners = new Set<() => void>();
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
    limits: () => ({ ...limits }),
    setVideoLimit: async (seconds) => {
      const saved = await saveUserVideoLimit(seconds);
      if (!saved.ok) return saved;
      const reread = await readMediaToolsConfiguration(options);
      if (!reread.ok) return reread;
      limits = reread.value.limits;
      return { ok: true, value: { ...limits } };
    },
    choices: () =>
      mediaChoicesOf({ connections: pool.connections(), defaults }),
    pick: async (pick) => {
      const checked = checkPick({ connections: pool.connections(), pick });
      if (!checked.ok) return checked;
      const saved = await saveUserDefault(pick);
      if (!saved.ok) return saved;
      const reread = await readMediaToolsConfiguration(options);
      if (!reread.ok) return reread;
      defaults = reread.value.defaults;
      return {
        ok: true,
        value: await mediaChoicesOf({
          connections: pool.connections(),
          defaults,
        }),
      };
    },
    chosenModel: async (choice) => {
      const selected = await selectServer({
        connections: pool.connections(),
        defaults,
        request: choice,
      });
      if (!selected.ok) return undefined;
      const { connection, model } = selected.value;
      const modelId =
        model ??
        describedDefaultModel({ connection, capability: choice.capability });
      return connection.description?.models.find(
        (candidate) =>
          candidate.id === modelId &&
          candidate.capability === choice.capability,
      );
    },
    run: async (request) => {
      const selected = await selectServer({
        connections: pool.connections(),
        defaults,
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
      if (waitsForDownload(connection)) {
        await pool.redescribe(connection);
        descriptionListeners.forEach((listener) => {
          listener();
        });
      }
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
    checkKey: (server) => checkServerKey({ pool, server, toolTimeoutSeconds }),
    prepare: async (request) => {
      const prepared = await prepareModel({
        pool,
        server: request.server,
        model: request.model,
        onProgress: request.onProgress,
        toolTimeoutSeconds,
      });
      descriptionListeners.forEach((listener) => {
        listener();
      });
      return prepared;
    },
    onDescriptionsChanged: (listener) => {
      descriptionListeners.add(listener);
      return () => {
        descriptionListeners.delete(listener);
      };
    },
    close: () => pool.close(),
  };
  return { ok: true, value: tools };
}
