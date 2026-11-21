import type { Outcome } from "../engineTypes.js";
import type { ServerCommand } from "./agentTypes.js";

export interface ConfigurationFormat {
  entryOf: (text: string) => Outcome<unknown, string>;
  withEntry: (options: {
    text: string | undefined;
    serverCommand: ServerCommand;
  }) => Outcome<string, string>;
}
