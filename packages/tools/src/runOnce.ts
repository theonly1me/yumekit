import { defaultCallsAtOnce } from "./callSlots.js";
import { mediaFailureText } from "./failureText.js";
import { waitsForDownload } from "./modelDownloads.js";
import type { CallOutcome } from "./requests/requestRecord.js";
import type { RunContext } from "./runMediaRequest.js";
import { runTool } from "./runTool.js";
import { describedDefaultModel, selectServer } from "./selectServer.js";
import { keyNotWorkingFailureOf } from "./serverOrder.js";
import { missingKeyFailureOf } from "./serverPool.js";
import { priceOfCall } from "./spending/priceOfCall.js";
import type {
  MediaToolFailure,
  MediaToolRequest,
  MediaToolRun,
  Outcome,
} from "./types.js";

export interface Attempt {
  ran: Outcome<MediaToolRun, MediaToolFailure>;
  outcome: CallOutcome;
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

function failedAttempt(options: {
  failure: MediaToolFailure;
  model?: string | undefined;
  charged?: { usd: number; basis: "catalog" | "cautious" } | undefined;
}): Attempt {
  const { failure } = options;
  return {
    ran: { ok: false, failure },
    outcome: {
      kind: "failed",
      failure: { kind: failure.kind, message: mediaFailureText(failure) },
      server: "server" in failure ? failure.server : undefined,
      model: options.model,
      charged: options.charged,
    },
  };
}

export async function runOnce(options: {
  context: RunContext;
  request: MediaToolRequest;
}): Promise<Attempt> {
  const { context, request } = options;
  const selected = await selectServer({
    connections: context.pool.connections(),
    defaults: context.defaults(),
    request,
    keyHealth: context.keyHealth,
  });
  if (!selected.ok) return failedAttempt({ failure: selected.failure });
  const keyFailure =
    (await missingKeyFailureOf(selected.value.connection)) ??
    keyNotWorkingFailureOf({
      connection: selected.value.connection,
      keyHealth: context.keyHealth,
    });
  if (keyFailure) return failedAttempt({ failure: keyFailure });
  const refreshed = await context.pool.refresh(selected.value.connection);
  if (!refreshed.ok) return failedAttempt({ failure: refreshed.failure });
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
  if (reservation !== undefined && !reservation.ok) {
    return failedAttempt({
      failure: reservation.failure,
      model: recordedModel,
    });
  }
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
    if (reservation === undefined || price.basis === "free") {
      return failedAttempt({ failure: ran.failure, model: recordedModel });
    }
    if (ran.failure.kind !== "media-tool-timeout") {
      reservation.value.release();
      return failedAttempt({ failure: ran.failure, model: recordedModel });
    }
    await reservation.value.settle({
      usd: price.usd,
      basis: price.basis,
      timedOut: true,
    });
    return failedAttempt({
      failure: ran.failure,
      model: recordedModel,
      charged: { usd: price.usd, basis: price.basis },
    });
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
  const run = {
    server: connection.name,
    ...(recordedModel === undefined ? {} : { model: recordedModel }),
    result,
    ...(cost === undefined ? {} : { cost }),
  };
  return { ran: { ok: true, value: run }, outcome: { kind: "made", run } };
}
