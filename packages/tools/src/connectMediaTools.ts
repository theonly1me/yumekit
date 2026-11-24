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
import { checkKeys } from "./keyHealth/checkKeys.js";
import { createKeyHealth, type KeyHealth } from "./keyHealth/keyHealth.js";
import { prepareModel } from "./modelDownloads.js";
import { runMediaRequest } from "./runMediaRequest.js";
import { createSpendingBook } from "./spending/spendingBook.js";
import { saveUserDefault } from "./saveUserDefault.js";
import { saveUserLimits } from "./saveUserLimit.js";
import {
  describedDefaultModel,
  isStarted,
  selectServer,
} from "./selectServer.js";
import { createServerPool } from "./serverPool.js";
import type {
  ConnectFailure,
  MediaServerEntry,
  MediaTools,
  Outcome,
  ServerCommand,
} from "./types.js";

const defaultToolTimeoutSeconds = 600;

function entryOf(options: {
  connection: StartedServer;
  keyHealth: KeyHealth;
}): MediaServerEntry {
  const { connection } = options;
  const keyProblem = options.keyHealth.problemOf(connection);
  return {
    server: connection.name,
    capabilities: [...connection.capabilities],
    canCheckKey: connection.toolNames.includes(checkKeyToolName),
    ...(keyProblem === undefined ? {} : { keyProblem }),
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
  const notifyDescriptionsChanged = () => {
    descriptionListeners.forEach((listener) => {
      listener();
    });
  };
  const keyHealth = createKeyHealth();
  const spendingBook = createSpendingBook({
    projectFolder: options.projectFolder,
    limitUsd: () => limits.spendingUsd,
  });
  const runContext = {
    pool,
    defaults: () => defaults,
    keyHealth,
    spendingBook,
    toolTimeoutSeconds,
    onDescriptionsChanged: notifyDescriptionsChanged,
  };
  const tools: MediaTools = {
    list: () =>
      pool
        .connections()
        .filter(isStarted)
        .map((connection) => entryOf({ connection, keyHealth })),
    failedServers: () =>
      pool
        .connections()
        .filter((connection) => connection.status === "failed")
        .map((connection) => ({
          server: connection.name,
          message: connection.message,
        })),
    limits: () => ({ ...limits }),
    setLimits: async (change) => {
      const saved = await saveUserLimits(change);
      if (!saved.ok) return saved;
      const reread = await readMediaToolsConfiguration(options);
      if (!reread.ok) return reread;
      limits = reread.value.limits;
      return { ok: true, value: { ...limits } };
    },
    choices: () =>
      mediaChoicesOf({ connections: pool.connections(), defaults, keyHealth }),
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
          keyHealth,
        }),
      };
    },
    chosenModel: async (choice) => {
      const selected = await selectServer({
        connections: pool.connections(),
        defaults,
        request: choice,
        keyHealth,
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
    run: (request) => runMediaRequest({ context: runContext, request }),
    checkKeys: () => checkKeys({ pool, keyHealth, toolTimeoutSeconds }),
    spending: () => spendingBook.summary(),
    checkKey: (server) => checkServerKey({ pool, server, toolTimeoutSeconds }),
    prepare: async (request) => {
      const prepared = await prepareModel({
        pool,
        server: request.server,
        model: request.model,
        onProgress: request.onProgress,
        toolTimeoutSeconds,
      });
      notifyDescriptionsChanged();
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
