import type { ServerConnection, StartedServer } from "./connectServer.js";
import type { KeyHealth } from "./keyHealth/keyHealth.js";
import { missingKeyFailureOf } from "./serverPool.js";
import type { Capability, MediaToolFailure, Outcome } from "./types.js";

const preferredServerNames = ["openai", "gemini", "fal"];
const lastServerNames = ["local-voice", "local-music", "sample"];

export function inNoPickOrder<Connection extends ServerConnection>(
  connections: Connection[],
): Connection[] {
  const named = (name: string) =>
    connections.filter((connection) => connection.name === name);
  const others = connections.filter(
    (connection) =>
      !preferredServerNames.includes(connection.name) &&
      !lastServerNames.includes(connection.name),
  );
  return [
    ...preferredServerNames.flatMap(named),
    ...others,
    ...lastServerNames.flatMap(named),
  ];
}

export function keyNotWorkingFailureOf(options: {
  connection: StartedServer;
  keyHealth: KeyHealth | undefined;
}): MediaToolFailure | undefined {
  const { connection } = options;
  const problem = options.keyHealth?.problemOf(connection);
  if (problem === undefined) return undefined;
  const [key] = connection.description?.keys ?? [];
  return {
    kind: "media-key-not-working",
    server: connection.name,
    message: problem,
    getKeyUrl: key?.get_key_url ?? "",
    steps: key === undefined ? [] : [...key.steps],
  };
}

export async function firstReadyServer(options: {
  connections: StartedServer[];
  capability: Capability;
  keyHealth: KeyHealth | undefined;
}): Promise<Outcome<StartedServer, MediaToolFailure>> {
  const candidates = inNoPickOrder(options.connections).filter((connection) =>
    connection.capabilities.includes(options.capability),
  );
  let firstMissingKey: MediaToolFailure | undefined;
  for (const candidate of candidates) {
    const keyFailure =
      (await missingKeyFailureOf(candidate)) ??
      keyNotWorkingFailureOf({
        connection: candidate,
        keyHealth: options.keyHealth,
      });
    if (keyFailure === undefined) return { ok: true, value: candidate };
    firstMissingKey ??= keyFailure;
  }
  return {
    ok: false,
    failure: firstMissingKey ?? {
      kind: "no-server-for-capability",
      capability: options.capability,
    },
  };
}
