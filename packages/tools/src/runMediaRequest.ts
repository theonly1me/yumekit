import type { CallSlots } from "./callSlots.js";
import type { MediaDefault } from "./configuration.js";
import type { KeyHealth } from "./keyHealth/keyHealth.js";
import { checkKeys } from "./keyHealth/checkKeys.js";
import type { RequestLog } from "./requests/requestLog.js";
import { runOnce } from "./runOnce.js";
import type { ServerPool } from "./serverPool.js";
import type { SpendingBook } from "./spending/spendingBook.js";
import type {
  Capability,
  MediaToolFailure,
  MediaToolRequest,
  MediaToolRun,
  Outcome,
} from "./types.js";

export interface RunContext {
  pool: ServerPool;
  defaults: () => Partial<Record<Capability, MediaDefault>>;
  keyHealth: KeyHealth;
  spendingBook: SpendingBook;
  requestLog: RequestLog;
  toolTimeoutSeconds: number;
  onDescriptionsChanged: () => void;
  spendingLimitUsd: () => Promise<number>;
  slots: CallSlots;
  callsAtOnce: () => number | undefined;
}

function isNoPick(options: {
  context: RunContext;
  request: MediaToolRequest;
}): boolean {
  return (
    options.request.server === undefined &&
    options.context.defaults()[options.request.capability] === undefined
  );
}

async function runAndRecord(options: {
  context: RunContext;
  request: MediaToolRequest;
}): Promise<Outcome<MediaToolRun, MediaToolFailure>> {
  const startedAt = new Date();
  const attempt = await runOnce(options);
  await options.context.requestLog.addCall({
    request: options.request,
    startedAt,
    outcome: attempt.outcome,
  });
  return attempt.ran;
}

export async function runMediaRequest(options: {
  context: RunContext;
  request: MediaToolRequest;
}): Promise<Outcome<MediaToolRun, MediaToolFailure>> {
  const { context } = options;
  await checkKeys({
    pool: context.pool,
    keyHealth: context.keyHealth,
    toolTimeoutSeconds: context.toolTimeoutSeconds,
    onlyServersWithNoKey: true,
  });
  const ran = await runAndRecord(options);
  if (ran.ok || ran.failure.kind !== "media-usage-limit-reached") return ran;
  if (!isNoPick(options) || (await context.spendingLimitUsd()) <= 0) {
    return ran;
  }
  const next = await runAndRecord(options);
  return !next.ok && next.failure.kind === "spending-limit-reached"
    ? ran
    : next;
}
