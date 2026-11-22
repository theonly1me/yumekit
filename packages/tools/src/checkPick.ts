import type { MediaPick, MediaPickFailure } from "./choiceTypes.js";
import type { ServerConnection } from "./connectServer.js";
import { isStarted } from "./selectServer.js";
import type { Outcome } from "./types.js";

export function checkPick(options: {
  connections: ServerConnection[];
  pick: MediaPick;
}): Outcome<undefined, MediaPickFailure> {
  const { pick } = options;
  const { server, model, capability } = pick;
  if (server === undefined) return { ok: true, value: undefined };
  const connection = options.connections
    .filter(isStarted)
    .find((candidate) => candidate.name === server);
  if (connection === undefined) {
    return { ok: false, failure: { kind: "server-not-found", server } };
  }
  if (!connection.capabilities.includes(capability)) {
    return {
      ok: false,
      failure: { kind: "no-server-for-capability", capability, server },
    };
  }
  const models = (connection.description?.models ?? []).filter(
    (each) => each.capability === capability,
  );
  if (model === undefined || models.some((each) => each.id === model)) {
    return { ok: true, value: undefined };
  }
  const known = models.map((each) => each.id).join(", ") || "none";
  return {
    ok: false,
    failure: {
      kind: "model-not-found",
      server,
      model,
      message: `The server "${server}" has no ${capability} model "${model}". Its models: ${known}.`,
    },
  };
}
