import type { ServerConnection, StartedServer } from "./connectServer.js";
import { missingKeyFailureOf } from "./serverPool.js";
import type { Capability, MediaToolFailure, Outcome } from "./types.js";

const preferredServerNames = ["openai", "gemini", "fal"];
const lastServerName = "sample";

export function inNoPickOrder<Connection extends ServerConnection>(
  connections: Connection[],
): Connection[] {
  const named = (name: string) =>
    connections.filter((connection) => connection.name === name);
  const others = connections.filter(
    (connection) =>
      !preferredServerNames.includes(connection.name) &&
      connection.name !== lastServerName,
  );
  return [
    ...preferredServerNames.flatMap(named),
    ...others,
    ...named(lastServerName),
  ];
}

export async function firstReadyServer(options: {
  connections: StartedServer[];
  capability: Capability;
}): Promise<Outcome<StartedServer, MediaToolFailure>> {
  const candidates = inNoPickOrder(options.connections).filter((connection) =>
    connection.capabilities.includes(options.capability),
  );
  let firstMissingKey: MediaToolFailure | undefined;
  for (const candidate of candidates) {
    const missingKey = await missingKeyFailureOf(candidate);
    if (missingKey === undefined) return { ok: true, value: candidate };
    firstMissingKey ??= missingKey;
  }
  return {
    ok: false,
    failure: firstMissingKey ?? {
      kind: "no-server-for-capability",
      capability: options.capability,
    },
  };
}
