import { z } from "zod";
import {
  authorization,
  falUrls,
  queueHostNames,
  requestJson,
  type FalFailure,
  type SendRequest,
} from "../falApi.ts";
import type { Outcome } from "../toolResults.ts";

export type Wait = (options: {
  seconds: number;
  signal: AbortSignal;
}) => Promise<void>;

export interface QueueOptions {
  sendRequest: SendRequest;
  apiKey: string;
  wait: Wait;
  signal: AbortSignal;
  onPoll: (status: string) => Promise<void>;
}

export const pollIntervalSeconds = 5;
export const maximumPolls = 110;

const queueUrl = z
  .url()
  .refine(
    (url) =>
      URL.canParse(url) &&
      queueHostNames.some((host) => new URL(url).hostname === host),
    "the URL is not on the fal queue host",
  );

const submitted = z.object({
  request_id: z.string().min(1),
  status_url: queueUrl,
  response_url: queueUrl,
});

const queueStatus = z.object({
  status: z.enum(["IN_QUEUE", "IN_PROGRESS", "COMPLETED"]),
});

function getRequest(options: { url: string; apiKey: string }): Request {
  return new Request(options.url, { headers: authorization(options.apiKey) });
}

async function waitForCompletion(
  options: QueueOptions & { statusUrl: string },
) {
  for (let pollNumber = 1; pollNumber <= maximumPolls; pollNumber += 1) {
    if (options.signal.aborted) {
      return { ok: false as const, failure: "The client cancelled the call." };
    }
    const status = await requestJson({
      sendRequest: options.sendRequest,
      schema: queueStatus,
      request: getRequest({ url: options.statusUrl, apiKey: options.apiKey }),
    });
    if (!status.ok)
      return { ok: false as const, failure: status.failure.message };
    if (status.value.status === "COMPLETED") return { ok: true as const };
    await options.onPoll(status.value.status);
    await options.wait({
      seconds: pollIntervalSeconds,
      signal: options.signal,
    });
  }
  return {
    ok: false as const,
    failure: `fal did not finish in ${String(maximumPolls * pollIntervalSeconds)} seconds, so the server stopped waiting. fal can still finish the request and bill it.`,
  };
}

export async function runQueueRequest<Output>(
  options: QueueOptions & {
    endpointId: string;
    fields: Record<string, unknown>;
    output: z.ZodType<Output>;
  },
): Promise<Outcome<Output, FalFailure>> {
  const submit = await requestJson({
    sendRequest: options.sendRequest,
    schema: submitted,
    request: new Request(`${falUrls.queue}/${options.endpointId}`, {
      method: "POST",
      headers: {
        ...authorization(options.apiKey),
        "content-type": "application/json",
      },
      body: JSON.stringify(options.fields),
    }),
  });
  if (!submit.ok) return submit;
  const requestText = `fal request ${submit.value.request_id}`;
  const completed = await waitForCompletion({
    ...options,
    statusUrl: submit.value.status_url,
  });
  if (!completed.ok) {
    return {
      ok: false,
      failure: { message: `${completed.failure} (${requestText})` },
    };
  }
  const result = await requestJson({
    sendRequest: options.sendRequest,
    schema: options.output,
    request: getRequest({
      url: submit.value.response_url,
      apiKey: options.apiKey,
    }),
  });
  if (!result.ok) {
    return {
      ok: false,
      failure: {
        ...result.failure,
        message: `${result.failure.message} (${requestText})`,
      },
    };
  }
  return result;
}
