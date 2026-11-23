import type {
  ChoiceCapability,
  ChoiceService,
  CurrentPick,
  MediaChoice,
  MediaChoices,
} from "./choiceTypes.js";
import type { ServerConnection, StartedServer } from "./connectServer.js";
import { readKeyStates } from "./keys/index.js";
import {
  describedDefaultModel,
  isStarted,
  serverWithNoPick,
  type MediaDefaults,
} from "./selectServer.js";
import { inNoPickOrder } from "./serverOrder.js";

export const choiceCapabilities = [
  "image",
  "speech",
  "music",
  "video",
  "sound-effect",
  "sharper",
] as const satisfies readonly ChoiceCapability[];

type ServiceFacts = Omit<ChoiceService, "models">;

async function factsOf(connection: StartedServer): Promise<ServiceFacts> {
  const keys = connection.description?.keys ?? [];
  const states = await readKeyStates({
    variables: keys.map((key) => key.variable),
  });
  const keysWithSource = keys.map((key) => ({
    ...key,
    source:
      states.find((state) => state.variable === key.variable)?.source ??
      "missing",
  }));
  return {
    server: connection.name,
    label: connection.description?.label ?? connection.name,
    state: keysWithSource.some((key) => key.source === "missing")
      ? "needs-key"
      : "ready",
    keys: keysWithSource,
  };
}

function serviceFor(options: {
  connection: StartedServer;
  facts: ServiceFacts;
  capability: ChoiceCapability;
}): ChoiceService {
  const models = (options.connection.description?.models ?? [])
    .filter((model) => model.capability === options.capability)
    .map((model) => ({
      id: model.id,
      label: model.label,
      isDefault: model.is_default,
    }));
  return { ...options.facts, models };
}

function currentOf(options: {
  server: string;
  model: string | undefined;
  source: CurrentPick["source"];
  services: ChoiceService[];
  connection: StartedServer | undefined;
  capability: ChoiceCapability;
}): CurrentPick {
  const { connection, capability } = options;
  const service = options.services.find(
    (each) => each.server === options.server,
  );
  const model =
    options.model ??
    (connection === undefined
      ? undefined
      : describedDefaultModel({ connection, capability }));
  const modelLabel = service?.models.find((each) => each.id === model)?.label;
  return {
    server: options.server,
    serverLabel: service?.label ?? options.server,
    ...(model === undefined ? {} : { model }),
    ...(modelLabel === undefined ? {} : { modelLabel }),
    source: options.source,
    state: service?.state ?? "not-available",
  };
}

async function choiceOf(options: {
  capability: ChoiceCapability;
  connections: ServerConnection[];
  defaults: MediaDefaults;
  facts: Map<string, ServiceFacts>;
}): Promise<MediaChoice> {
  const { capability, connections } = options;
  const started = inNoPickOrder(connections.filter(isStarted)).filter(
    (connection) => connection.capabilities.includes(capability),
  );
  const services = started.flatMap((connection) => {
    const facts = options.facts.get(connection.name);
    return facts === undefined
      ? []
      : [serviceFor({ connection, facts, capability })];
  });
  const picked = options.defaults[capability];
  const firstReady =
    picked === undefined
      ? await serverWithNoPick({ connections, defaults: {}, capability })
      : undefined;
  const server =
    picked?.server ?? (firstReady?.ok ? firstReady.value.name : undefined);
  if (server === undefined) return { capability, services };
  const current = currentOf({
    server,
    model: picked?.model,
    source: picked === undefined ? "first-ready" : "picked",
    services,
    connection: started.find((connection) => connection.name === server),
    capability,
  });
  return { capability, current, services };
}

export async function mediaChoicesOf(options: {
  connections: ServerConnection[];
  defaults: MediaDefaults;
}): Promise<MediaChoices> {
  const started = options.connections.filter(isStarted);
  const facts = new Map(
    (await Promise.all(started.map(factsOf))).map((each) => [
      each.server,
      each,
    ]),
  );
  const choices = await Promise.all(
    choiceCapabilities.map((capability) =>
      choiceOf({ ...options, capability, facts }),
    ),
  );
  const failedServers = options.connections.flatMap((connection) =>
    connection.status === "failed"
      ? [{ server: connection.name, message: connection.message }]
      : [],
  );
  return { choices, failedServers };
}
