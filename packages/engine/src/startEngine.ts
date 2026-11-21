import { randomBytes } from "node:crypto";
import { realpath } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { openProject, type ProjectStore } from "@yumekit/project";
import { removeEngineFile, writeEngineFile } from "./engineFile/engineFile.js";
import {
  engineUrlOf,
  findRunningEngine,
} from "./engineFile/findRunningEngine.js";
import type { Engine, EngineFailure, Outcome } from "./engineTypes.js";
import { createEventHub, type EventHub } from "./events/eventHub.js";
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

async function closeParts(parts: EngineParts): Promise<void> {
  await parts.harness.close();
  await parts.preview.close();
}

export async function startEngine(options: {
  projectFolder: string;
  editorFolder?: string;
  port?: number;
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
  const started = await startParts({ projectFolder, store });
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
  server.on(
    "request",
    createRequestHandler({
      context: { origin, projectFolder, store, events, ...parts },
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
  await writeEngineFile({
    projectFolder,
    content: { port, token, processId: process.pid },
  });
  const stopFollowing = followProjectChanges({ store, events, parts });
  let closing: Promise<void> | undefined;
  const close = async () => {
    events.send({ type: "engine-closing" });
    const serverClosed = closeServer(server);
    await parts.harness.close();
    await stopFollowing();
    await parts.preview.close();
    await events.close();
    server.closeAllConnections();
    await serverClosed;
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
