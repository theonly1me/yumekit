import { defaultCallsAtOnce, type CallSlots } from "./callSlots.js";
import type { MediaDefault } from "./configuration.js";
import type { KeyHealth } from "./keyHealth/keyHealth.js";
import { checkKeys } from "./keyHealth/checkKeys.js";
import { waitsForDownload } from "./modelDownloads.js";
import { runTool } from "./runTool.js";
import { describedDefaultModel, selectServer } from "./selectServer.js";
import { keyNotWorkingFailureOf } from "./serverOrder.js";
import { missingKeyFailureOf, type ServerPool } from "./serverPool.js";
import { priceOfCall } from "./spending/priceOfCall.js";
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
  toolTimeoutSeconds: number;
  onDescriptionsChanged: () => void;
  spendingLimitUsd: () => number;
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

function quotaSkipOf(server: string): {
  ok: false;
  failure: MediaToolFailure;
} {
  return {
    ok: false,
    failure: {
      kind: "service-quota",
      server,
      message: `yumekit did not send this call: an earlier call of the same group used up the quota of ${server}.`,
    },
  };
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
  const ran = await runOnce(options);
  if (ran.ok || ran.failure.kind !== "media-usage-limit-reached") return ran;
  if (!isNoPick(options) || context.spendingLimitUsd() <= 0) return ran;
  const next = await runOnce(options);
  return !next.ok && next.failure.kind === "spending-limit-reached"
    ? ran
    : next;
}

async function runOnce(options: {
  context: RunContext;
  request: MediaToolRequest;
}): Promise<Outcome<MediaToolRun, MediaToolFailure>> {
  const { context, request } = options;
  const selected = await selectServer({
    connections: context.pool.connections(),
    defaults: context.defaults(),
    request,
    keyHealth: context.keyHealth,
  });
  if (!selected.ok) return selected;
  const keyFailure =
    (await missingKeyFailureOf(selected.value.connection)) ??
    keyNotWorkingFailureOf({
      connection: selected.value.connection,
      keyHealth: context.keyHealth,
    });
  if (keyFailure) return { ok: false, failure: keyFailure };
  const refreshed = await context.pool.refresh(selected.value.connection);
  if (!refreshed.ok) return refreshed;
  const connection = refreshed.value;
  const { model } = selected.value;
  const recordedModel =
    model ??
    describedDefaultModel({ connection, capability: request.capability });
  const price = priceOfCall({ connection, model, request });
  const reservation =
    price.basis === "free"
      ? undefined
      : await context.spendingBook.reserve({
          server: connection.name,
          ...(recordedModel === undefined ? {} : { model: recordedModel }),
          capability: request.capability,
          fileStem: request.fileStem,
          usd: price.usd,
          basis: price.basis,
        });
  if (reservation !== undefined && !reservation.ok) return reservation;
  const ran = await context.slots.run({
    server: connection.name,
    callsAtOnce: Math.min(
      connection.description?.calls_at_once ?? defaultCallsAtOnce,
      context.callsAtOnce() ?? defaultCallsAtOnce,
    ),
    onWait: () => {
      request.onState?.({ server: connection.name, state: "waiting" });
      request.onProgress?.({
        done: 0,
        message: `Waiting for a free place at ${connection.name}`,
      });
    },
    work: async () => {
      if (request.skipServers?.().has(connection.name) === true) {
        return quotaSkipOf(connection.name);
      }
      request.onState?.({ server: connection.name, state: "running" });
      const result = await runTool({
        server: connection.name,
        client: connection.client,
        request,
        model,
        toolTimeoutSeconds: context.toolTimeoutSeconds,
      });
      if (!result.ok && result.failure.kind === "service-quota") {
        request.onServiceQuota?.(connection.name);
      }
      return result;
    },
  });
  if (waitsForDownload(connection)) {
    await context.pool.redescribe(connection);
    context.onDescriptionsChanged();
  }
  if (!ran.ok) {
    if (ran.failure.kind === "media-usage-limit-reached") {
      context.keyHealth.noteUsageLimit({
        connection,
        message: ran.failure.message,
      });
    }
    if (ran.failure.kind === "media-tool-failed") {
      context.keyHealth.noteFailedCall({
        connection,
        message: ran.failure.message,
      });
    }
    if (reservation === undefined || price.basis === "free") return ran;
    if (ran.failure.kind === "media-tool-timeout") {
      await reservation.value.settle({
        usd: price.usd,
        basis: price.basis,
        timedOut: true,
      });
    } else {
      reservation.value.release();
    }
    return ran;
  }
  const result = ran.value;
  const cost =
    reservation === undefined || price.basis === "free"
      ? undefined
      : result.cost_usd === undefined
        ? { usd: price.usd, basis: price.basis }
        : {
            usd: result.cost_usd,
            basis:
              result.cost_is_estimate === false
                ? ("reported" as const)
                : ("catalog" as const),
          };
  if (reservation !== undefined && cost !== undefined) {
    await reservation.value.settle(cost);
  }
  return {
    ok: true,
    value: {
      server: connection.name,
      ...(recordedModel === undefined ? {} : { model: recordedModel }),
      result,
      ...(cost === undefined ? {} : { cost }),
    },
  };
}
