import {
  connectServer,
  hasSameEnvironment,
  passedEnvironmentOf,
  type ServerConnection,
  type StartedServer,
} from "./connectServer.js";
import { readKeyStates } from "./keys/index.js";
import type { MediaToolFailure, Outcome } from "./types.js";

type StartFailure = Extract<
  MediaToolFailure,
  { kind: "server-failed-to-start" }
>;

export interface ServerPool {
  connections: () => ServerConnection[];
  refresh: (
    connection: StartedServer,
  ) => Promise<Outcome<StartedServer, StartFailure>>;
  close: () => Promise<void>;
}

export async function missingKeyFailureOf(
  connection: StartedServer,
): Promise<MediaToolFailure | undefined> {
  const keys = connection.description?.keys ?? [];
  if (keys.length === 0) return undefined;
  const states = await readKeyStates({
    variables: keys.map((key) => key.variable),
  });
  const missing = keys.find(
    (key) =>
      states.find((state) => state.variable === key.variable)?.source ===
      "missing",
  );
  if (!missing) return undefined;
  return {
    kind: "media-key-missing",
    server: connection.name,
    variable: missing.variable,
    getKeyUrl: missing.get_key_url,
    steps: [...missing.steps],
  };
}

export function createServerPool(
  initialConnections: ServerConnection[],
): ServerPool {
  const connections = [...initialConnections];
  const restarts = new Map<
    StartedServer,
    Promise<Outcome<StartedServer, StartFailure>>
  >();

  async function restart(
    connection: StartedServer,
  ): Promise<Outcome<StartedServer, StartFailure>> {
    await connection.client.close();
    const restarted = await connectServer({
      name: connection.name,
      command: connection.command,
    });
    const index = connections.indexOf(connection);
    connections.splice(index, 1, restarted);
    if (restarted.status === "failed") {
      return {
        ok: false,
        failure: {
          kind: "server-failed-to-start",
          server: restarted.name,
          message: restarted.message,
        },
      };
    }
    return { ok: true, value: restarted };
  }

  return {
    connections: () => [...connections],
    refresh: async (connection) => {
      const pending = restarts.get(connection);
      if (pending) return pending;
      const current = await passedEnvironmentOf(connection.command);
      if (hasSameEnvironment({ passed: connection.passedEnvironment, current }))
        return { ok: true, value: connection };
      const started = restarts.get(connection) ?? restart(connection);
      restarts.set(connection, started);
      return started;
    },
    close: async () => {
      await Promise.all(
        connections.map((connection) =>
          connection.status === "started"
            ? connection.client.close()
            : Promise.resolve(),
        ),
      );
    },
  };
}
