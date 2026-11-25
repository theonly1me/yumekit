import type { ServerConnection } from "../connectServer.js";

export interface KeyValue {
  variable: string;
  value: string;
}

export function keyValuesOfServers(
  connections: ServerConnection[],
): KeyValue[] {
  return connections.flatMap((connection) =>
    connection.status === "started"
      ? (connection.description?.keys ?? []).flatMap((key) => {
          const value = connection.passedEnvironment[key.variable];
          return value === undefined || value === ""
            ? []
            : [{ variable: key.variable, value }];
        })
      : [],
  );
}

export function withoutKeyValues(options: {
  text: string;
  keys: KeyValue[];
}): string {
  return options.keys.reduce(
    (...[text, key]) => text.split(key.value).join(`[${key.variable}]`),
    options.text,
  );
}
