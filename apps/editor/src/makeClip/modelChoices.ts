import type {
  Capability,
  MediaKey,
  MediaModel,
  MediaServer,
  MediaServers,
} from "../tools/mediaServers.js";
import { isServerReady, labelOf } from "../tools/serverFacts.js";

export interface ModelChoice {
  key: string;
  server: MediaServer;
  serverLabel: string;
  model: MediaModel;
  isReady: boolean;
  missingKey: MediaKey | undefined;
}

export interface ServerGroup {
  server: string;
  label: string;
  choices: ModelChoice[];
}

export function modelChoicesOf(options: {
  servers: MediaServers;
  capability: Capability;
}): ModelChoice[] {
  return options.servers.servers.flatMap((server) =>
    server.models
      .filter((model) => model.capability === options.capability)
      .map((model) => ({
        key: `${server.server}/${model.id}`,
        server,
        serverLabel: labelOf(server),
        model,
        isReady: isServerReady(server),
        missingKey: server.keys.find((key) => key.source === "missing"),
      })),
  );
}

export function groupsOf(choices: ModelChoice[]): ServerGroup[] {
  const groups: ServerGroup[] = [];
  for (const choice of choices) {
    const group = groups.find((each) => each.server === choice.server.server);
    if (group === undefined) {
      groups.push({
        server: choice.server.server,
        label: choice.serverLabel,
        choices: [choice],
      });
    } else {
      group.choices.push(choice);
    }
  }
  return groups;
}

export function firstChoiceOf(choices: ModelChoice[]): ModelChoice | undefined {
  return (
    choices.find((choice) => choice.isReady && choice.model.is_default) ??
    choices.find((choice) => choice.isReady) ??
    choices[0]
  );
}

export function pickedChoiceOf(options: {
  choices: ModelChoice[];
  picked: { server: string; model: string | undefined } | undefined;
}): ModelChoice | undefined {
  const { picked } = options;
  if (picked === undefined) return undefined;
  const ofServer = options.choices.filter(
    (choice) => choice.server.server === picked.server,
  );
  return (
    ofServer.find((choice) => choice.model.id === picked.model) ?? ofServer[0]
  );
}
