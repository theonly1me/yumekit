import { z } from "zod";
import type { Outcome } from "../engineTypes.js";
import { serverName, type ServerCommand } from "./agentTypes.js";
import type { ConfigurationFormat } from "./configurationFormat.js";

const jsonFileSchema = z.looseObject({
  mcpServers: z.record(z.string(), z.unknown()).optional(),
});

type JsonFile = z.infer<typeof jsonFileSchema>;

function jsonFileOf(text: string): Outcome<JsonFile, string> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      failure: `The file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  const parsed = jsonFileSchema.safeParse(value);
  return parsed.success && !Array.isArray(parsed.data.mcpServers)
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        failure: "The file must hold one object, with mcpServers as an object.",
      };
}

function entryOf(serverCommand: ServerCommand) {
  return {
    type: "stdio",
    command: serverCommand.command,
    args: serverCommand.args,
  };
}

export const jsonFormat: ConfigurationFormat = {
  entryOf: (text) => {
    const file = jsonFileOf(text);
    return file.ok
      ? { ok: true, value: file.value.mcpServers?.[serverName] }
      : file;
  },
  withEntry: ({ text, serverCommand }) => {
    const file: Outcome<JsonFile, string> =
      text === undefined ? { ok: true, value: {} } : jsonFileOf(text);
    if (!file.ok) return file;
    const next = {
      ...file.value,
      mcpServers: {
        ...file.value.mcpServers,
        [serverName]: entryOf(serverCommand),
      },
    };
    return { ok: true, value: `${JSON.stringify(next, null, 2)}\n` };
  },
};
