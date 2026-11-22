import { randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import type { ServerCommand } from "../agents/agentTypes.js";
import { findAgentPrograms } from "../chat/agentChoice.js";
import { engineUrlOf } from "../engineFile/findRunningEngine.js";
import type { Outcome } from "../engineTypes.js";
import { createRequestHandler } from "../http/handleRequest.js";
import { engineVersion } from "../startup/startParts.js";
import { listenOnLoopback } from "../startup/listenOnLoopback.js";
import type { HomeContext } from "./homeContext.js";
import { homeRoutes } from "./homeRoutes.js";
import type { HomeFailure, HomeServer } from "./homeTypes.js";
import { createProjectEngines } from "./projectEngines.js";

function closeServer(server: Server): Promise<void> {
  const closed = Promise.withResolvers<undefined>();
  server.close(() => {
    closed.resolve(undefined);
  });
  server.closeAllConnections();
  return closed.promise;
}

export async function startHomeServer(options: {
  editorFolder?: string;
  port?: number;
  serverCommandOf: (projectFolder: string) => ServerCommand;
}): Promise<Outcome<HomeServer, HomeFailure>> {
  const server = createServer();
  const listened = await listenOnLoopback({ server, port: options.port ?? 0 });
  if (!listened.ok) {
    return {
      ok: false,
      failure: { kind: "port-not-free", port: options.port ?? 0 },
    };
  }
  const port = listened.value;
  const token = randomBytes(32).toString("hex");
  const editorFolder =
    options.editorFolder === undefined
      ? undefined
      : resolve(options.editorFolder);
  const engines = createProjectEngines({
    editorFolder,
    serverCommandOf: options.serverCommandOf,
  });
  const context: HomeContext = {
    version: await engineVersion(),
    programs: await findAgentPrograms(),
    engines,
    creating: { queue: Promise.resolve() },
  };
  server.on(
    "request",
    createRequestHandler({
      context,
      routes: homeRoutes,
      port,
      token,
      editorFolder,
    }),
  );
  server.on("upgrade", (...parameters) => {
    const [, socket] = parameters;
    socket.destroy();
  });
  let closing: Promise<void> | undefined;
  const close = async () => {
    await engines.closeAll();
    await closeServer(server);
  };
  return {
    ok: true,
    value: {
      url: engineUrlOf({ port, token }).url,
      token,
      close: () => {
        closing ??= close();
        return closing;
      },
    },
  };
}
