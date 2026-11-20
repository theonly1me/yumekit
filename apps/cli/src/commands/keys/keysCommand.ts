import {
  keyFilePath,
  listServerKeys,
  readKeyStates,
  removeKey,
  saveKey,
  type KeyFailure,
  type ServerKeys,
} from "@yumekit/tools";
import { findBundledServers } from "../../bundledServers.js";
import { failed, usageError, type CommandResult } from "../../commandResult.js";
import { parseCommandLine } from "../../options.js";
import { readSecret } from "./readSecret.js";

function serverLines(entry: ServerKeys): string[] {
  switch (entry.status) {
    case "failed":
      return [`${entry.server}: did not start: ${entry.message}`];
    case "not-described":
      return [`${entry.server}: gives no description of its keys`];
    case "described":
      if (entry.keys.length === 0) {
        return [`${entry.server} (${entry.label}): needs no key`];
      }
      return [
        `${entry.server} (${entry.label}):`,
        ...entry.keys.flatMap((key) => [
          `  ${key.variable}: ${key.source}`,
          ...(key.source === "missing"
            ? [
                `    Get it at ${key.get_key_url}`,
                ...[...key.steps.entries()].map(
                  ([index, step]) => `    ${String(index + 1)}. ${step}`,
                ),
                `    Then run: yumekit keys set ${key.variable}`,
              ]
            : []),
        ]),
      ];
  }
}

async function listKeys(): Promise<CommandResult> {
  const listed = await listServerKeys({
    bundledServers: await findBundledServers(),
  });
  if (!listed.ok) {
    return failed(
      `${listed.failure.file} is not valid: ${listed.failure.message}`,
    );
  }
  const lines = [
    `Key file: ${keyFilePath()}`,
    ...listed.value.flatMap(serverLines),
  ];
  return { kind: "done", output: `${lines.join("\n")}\n` };
}

function keyFailureMessage(failure: KeyFailure): string {
  return failure.kind === "key-not-valid"
    ? failure.message
    : `Cannot write ${failure.file}: ${failure.message}`;
}

async function environmentNote(variable: string): Promise<string> {
  const [state] = await readKeyStates({ variables: [variable] });
  return state?.source === "environment"
    ? ` The environment variable ${variable} is also set, and it wins over the key file.`
    : "";
}

async function setKey(variable: string): Promise<CommandResult> {
  const secret = await readSecret(variable);
  if (secret.kind === "cancelled") return failed("Cancelled. Nothing saved.");
  const saved = await saveKey({ variable, value: secret.value });
  if (!saved.ok) return failed(keyFailureMessage(saved.failure));
  return {
    kind: "done",
    output: `Saved ${variable} in ${keyFilePath()}.${await environmentNote(variable)}\n`,
  };
}

async function deleteKey(variable: string): Promise<CommandResult> {
  const removed = await removeKey({ variable });
  if (!removed.ok) return failed(keyFailureMessage(removed.failure));
  return {
    kind: "done",
    output: removed.value.removed
      ? `Removed ${variable} from ${keyFilePath()}.\n`
      : `${variable} is not in ${keyFilePath()}.\n`,
  };
}

export async function keysCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({ args, config: {} });
  if (!parsed.ok) return usageError(parsed.message);
  const [action, variable, ...extra] = parsed.value.positionals;
  if (action === undefined) return listKeys();
  if (variable === undefined || extra.length > 0) {
    return usageError(
      "keys takes no argument, or set or remove and one variable name. The value is never an argument.",
    );
  }
  if (action === "set") return setKey(variable);
  if (action === "remove") return deleteKey(variable);
  return usageError(`Unknown keys action "${action}".`);
}
