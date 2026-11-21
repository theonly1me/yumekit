import { isDeepStrictEqual } from "node:util";
import { parse, stringify, type TomlTable } from "smol-toml";
import type { Outcome } from "../engineTypes.js";
import { serverName, type ServerCommand } from "./agentTypes.js";
import type { ConfigurationFormat } from "./configurationFormat.js";

const serversKey = "mcp_servers";

const ownTableHeader = new RegExp(
  `^\\s*\\[\\s*${serversKey}\\s*\\.\\s*"?${serverName}"?\\s*(\\.[^\\]]*)?\\]\\s*(#.*)?$`,
);

const anyTableHeader = /^\s*\[/;

function tableOf(text: string): Outcome<TomlTable, string> {
  try {
    return { ok: true, value: structuredClone(parse(text)) };
  } catch (error) {
    return {
      ok: false,
      failure: `The file is not valid TOML: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function serversOf(table: TomlTable): Outcome<TomlTable | undefined, string> {
  const servers = table[serversKey];
  if (servers === undefined) return { ok: true, value: undefined };
  if (typeof servers !== "object" || Array.isArray(servers)) {
    return { ok: false, failure: `${serversKey} must be a table.` };
  }
  return servers instanceof Date
    ? { ok: false, failure: `${serversKey} must be a table.` }
    : { ok: true, value: servers };
}

function withoutOwnEntry(table: TomlTable): TomlTable {
  const servers = serversOf(table);
  if (!servers.ok || servers.value === undefined) return table;
  const others = Object.entries(servers.value).filter(
    ([name]) => name !== serverName,
  );
  const rest = Object.fromEntries(
    Object.entries(table).filter(([key]) => key !== serversKey),
  );
  return others.length === 0
    ? rest
    : { ...rest, [serversKey]: Object.fromEntries(others) };
}

function withoutOwnTables(text: string): string {
  let isInOwnTable = false;
  const kept = text.split("\n").filter((line) => {
    if (anyTableHeader.test(line)) isInOwnTable = ownTableHeader.test(line);
    return !isInOwnTable;
  });
  return kept.join("\n").trimEnd();
}

function ownEntryOf(serverCommand: ServerCommand): TomlTable {
  return { command: serverCommand.command, args: serverCommand.args };
}

function entryOf(text: string): Outcome<unknown, string> {
  const table = tableOf(text);
  if (!table.ok) return table;
  const servers = serversOf(table.value);
  return servers.ok
    ? { ok: true, value: servers.value?.[serverName] }
    : servers;
}

export const tomlFormat: ConfigurationFormat = {
  entryOf,
  withEntry: ({ text, serverCommand }) => {
    const ownEntry = ownEntryOf(serverCommand);
    const block = stringify({ [serversKey]: { [serverName]: ownEntry } });
    if (text === undefined) return { ok: true, value: block };
    const before = tableOf(text);
    if (!before.ok) return before;
    const servers = serversOf(before.value);
    if (!servers.ok) return servers;
    const rest = withoutOwnTables(text);
    const next = rest === "" ? block : `${rest}\n\n${block}`;
    const after = tableOf(next);
    const entryAfter = entryOf(next);
    const isSafeChange =
      after.ok &&
      entryAfter.ok &&
      isDeepStrictEqual(entryAfter.value, ownEntry) &&
      isDeepStrictEqual(
        withoutOwnEntry(after.value),
        withoutOwnEntry(before.value),
      );
    return isSafeChange
      ? { ok: true, value: next }
      : {
          ok: false,
          failure: `yumekit cannot change the ${serverName} entry of this file safely. Change the file by hand.`,
        };
  },
};
