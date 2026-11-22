import { randomBytes } from "node:crypto";
import { realpath } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { openProject, type ProjectStore } from "@yumekit/project";
import type { ServerCommand } from "./agents/agentTypes.js";
import { createChat, type Chat } from "./chat/chat.js";
import { trackStore } from "./chat/trackedStore.js";
import { claimEngineFile } from "./engineFile/claimEngineFile.js";
import { removeEngineFile } from "./engineFile/engineFile.js";
import {
  engineUrlOf,
  findRunningEngine,
} from "./engineFile/findRunningEngine.js";
import type { Engine, EngineFailure, Outcome } from "./engineTypes.js";
import { createEventHub, type EventHub } from "./events/eventHub.js";
import { engineRoutes } from "./http/engineRoutes.js";
import { createRequestHandler } from "./http/handleRequest.js";
import { listenOnLoopback } from "./startup/listenOnLoopback.js";
import { startParts, type EngineParts } from "./startup/startParts.js";

function followProjectChanges(options: {
  store: ProjectStore;
  events: EventHub;
  parts: EngineParts;
}): () => Promise<void> {
  let refreshing = Promise.resolve();
  const unsubscribe = options.store.subscribe((snapshot) => {
    options.events.send({
      type: "project-changed",
      revision: snapshot.revision,
    });
    refreshing = refreshing
      .then(() => options.parts.preview.refresh())
      .catch(() => undefined);
  });
  return async () => {
    unsubscribe();
    await refreshing;
  };
}

function closeServer(server: Server): Promise<void> {
  const closed = Promise.withResolvers<undefined>();
  server.close(() => {
    closed.resolve(undefined);
  });
  return closed.promise;
}

function noWait(): Promise<void> {
  return Promise.resolve();
}

async function closeRunning(options: {
  server: Server;
  events: EventHub;
  parts: EngineParts;
  chat: Chat;
  stopFollowing: () => Promise<void>;
}): Promise<void> {
  const { server, events, parts } = options;
  events.send({ type: "engine-closing" });
  await options.chat.close();
  const serverClosed = closeServer(server);
  await parts.harness.close();
  await options.stopFollowing();
  await parts.preview.close();
  await events.close();
  server.closeAllConnections();
  await serverClosed;
}

async function closeParts(parts: EngineParts): Promise<void> {
  await parts.harness.close();
  await parts.preview.close();
}

export async function startEngine(options: {
  projectFolder: string;
  editorFolder?: string;
  port?: number;
  serverCommand?: ServerCommand;
}): Promise<Outcome<Engine, EngineFailure>> {
  const opened = await openProject({ folder: resolve(options.projectFolder) });
  if (!opened.ok) {
    return {
      ok: false,
      failure: { kind: "project-invalid", message: opened.failure.message },
    };
  }
  const store = opened.value;
  const projectFolder = await realpath(store.folder);
  const running = await findRunningEngine(projectFolder);
  if (running !== undefined) {
    return {
      ok: false,
      failure: { kind: "engine-already-running", url: running.url },
    };
  }
  const tracked = trackStore(store);
  const started = await startParts({ projectFolder, store: tracked.store });
  if (!started.ok) return started;
  const parts = started.value;
  const server = createServer();
  const listened = await listenOnLoopback({ server, port: options.port ?? 0 });
  if (!listened.ok) {
    await closeParts(parts);
    return listened;
  }
  const port = listened.value;
  const token = randomBytes(32).toString("hex");
  const { origin, url } = engineUrlOf({ port, token });
  const events = createEventHub({ port, token });
  const chat = await createChat({
    projectFolder,
    store,
    tracked,
    events,
    serverCommand: options.serverCommand,
  });
  server.on(
    "request",
    createRequestHandler({
      context: {
        origin,
        projectFolder,
        store,
        events,
        chat,
        serverCommand: options.serverCommand,
        ...parts,
      },
      routes: engineRoutes,
      port,
      token,
      editorFolder:
        options.editorFolder === undefined
          ? undefined
          : resolve(options.editorFolder),
    }),
  );
  server.on("upgrade", (...parameters) => {
    const [request, socket, head] = parameters;
    events.handleUpgrade({ request, socket, head });
  });
  const claimed = await claimEngineFile({
    projectFolder,
    content: { port, token, processId: process.pid },
  });
  if (!claimed.ok) {
    await closeRunning({
      server,
      events,
      parts,
      chat,
      stopFollowing: noWait,
    });
    return claimed;
  }
  const stopFollowing = followProjectChanges({ store, events, parts });
  let closing: Promise<void> | undefined;
  const close = async () => {
    await closeRunning({ server, events, parts, chat, stopFollowing });
    await removeEngineFile({ projectFolder, token });
  };
  return {
    ok: true,
    value: {
      url,
      token,
      close: () => {
        closing ??= close();
        return closing;
      },
    },
  };
}
