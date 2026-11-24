import { callCheckKey } from "../checkKey.js";
import { checkKeyToolName } from "../convention.js";
import type { StartedServer } from "../connectServer.js";
import { isStarted } from "../selectServer.js";
import { missingKeyFailureOf, type ServerPool } from "../serverPool.js";
import type { KeyHealth } from "./keyHealth.js";

async function checkOne(options: {
  connection: StartedServer;
  pool: ServerPool;
  keyHealth: KeyHealth;
  toolTimeoutSeconds: number;
  onlyServersWithNoKey: boolean;
}): Promise<void> {
  const { keyHealth } = options;
  const { description } = options.connection;
  if (description === undefined) return;
  if (options.onlyServersWithNoKey && description.keys.length > 0) return;
  if (!options.connection.toolNames.includes(checkKeyToolName)) return;
  if ((await missingKeyFailureOf(options.connection)) !== undefined) return;
  const refreshed = await options.pool.refresh(options.connection);
  if (!refreshed.ok) return;
  const connection = refreshed.value;
  if (!keyHealth.needsCheck(connection)) return;
  const checked = await callCheckKey({
    connection,
    toolTimeoutSeconds: options.toolTimeoutSeconds,
  });
  if (checked.ok) keyHealth.noteCheck({ connection, check: checked.value });
}

export async function checkKeys(options: {
  pool: ServerPool;
  keyHealth: KeyHealth;
  toolTimeoutSeconds: number;
  onlyServersWithNoKey?: boolean;
}): Promise<void> {
  const onlyServersWithNoKey = options.onlyServersWithNoKey ?? false;
  await Promise.all(
    options.pool
      .connections()
      .filter(isStarted)
      .map((connection) =>
        checkOne({ ...options, connection, onlyServersWithNoKey }),
      ),
  );
}
