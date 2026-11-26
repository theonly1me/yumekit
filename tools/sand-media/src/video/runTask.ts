import { z } from "zod";
import {
  failureKindOf,
  requestJson,
  sandRequest,
  sandUrls,
  type SandFailure,
  type SendRequest,
} from "../sandApi.ts";
import type { Outcome } from "../toolResults.ts";

export const pollIntervalSeconds = 10;

export const maximumPolls = 55;

export type Wait = (seconds: number) => Promise<void>;

export interface TaskConnection {
  sendRequest: SendRequest;
  apiKey: string;
  wait: Wait;
  reportProgress: (progress: { poll: number; status: string }) => Promise<void>;
}

const createdTask = z.object({ id: z.string().min(1) });

const task = z.object({
  id: z.string().min(1),
  status: z.string(),
  content: z.object({ video_url: z.url().optional() }).nullish(),
  error: z
    .object({ code: z.string().optional(), message: z.string().optional() })
    .nullish(),
});

const runningStatuses = ["queued", "running"];

export interface FinishedTask {
  id: string;
  videoUrl: string;
}

function endedFailure(options: {
  id: string;
  status: string;
  error: z.infer<typeof task>["error"];
}): SandFailure {
  const { code, message } = options.error ?? {};
  const reason = [code, message]
    .filter((part) => part !== undefined && part !== "")
    .join(": ");
  return {
    kind: failureKindOf(code),
    message: `Sand AI ended the task ${options.id} with the status ${options.status}${reason === "" ? "." : `: ${reason}`}`,
    ...(code === undefined ? {} : { code }),
    canRetry: false,
  };
}

function readTask(options: { connection: TaskConnection; id: string }) {
  return requestJson({
    sendRequest: options.connection.sendRequest,
    schema: task,
    request: sandRequest({
      url: `${sandUrls.tasks}/${encodeURIComponent(options.id)}`,
      apiKey: options.connection.apiKey,
    }),
  });
}

async function waitForTask(options: {
  connection: TaskConnection;
  id: string;
}): Promise<Outcome<FinishedTask, SandFailure>> {
  const { connection, id } = options;
  let status = "queued";
  for (let poll = 1; poll <= maximumPolls; poll += 1) {
    await connection.wait(pollIntervalSeconds);
    await connection.reportProgress({ poll, status });
    const read = await readTask({ connection, id });
    if (!read.ok) {
      if (read.failure.canRetry) continue;
      return read;
    }
    status = read.value.status;
    if (runningStatuses.includes(status)) continue;
    const videoUrl = read.value.content?.video_url;
    if (status === "succeeded" && videoUrl !== undefined) {
      return { ok: true, value: { id, videoUrl } };
    }
    if (status === "succeeded") {
      return {
        ok: false,
        failure: {
          kind: "other",
          message: `Sand AI finished the task ${id} with no link to the clip.`,
          canRetry: false,
        },
      };
    }
    return {
      ok: false,
      failure: endedFailure({ id, status, error: read.value.error }),
    };
  }
  return {
    ok: false,
    failure: {
      kind: "other",
      message: `Sand AI did not finish the task ${id} in ${String(maximumPolls * pollIntervalSeconds)} seconds. Sand AI can still finish the clip and charge for it.`,
      canRetry: false,
    },
  };
}

export async function runTask(options: {
  connection: TaskConnection;
  body: string;
}): Promise<Outcome<FinishedTask, SandFailure>> {
  const { connection } = options;
  const created = await requestJson({
    sendRequest: connection.sendRequest,
    schema: createdTask,
    request: sandRequest({
      url: sandUrls.tasks,
      apiKey: connection.apiKey,
      body: options.body,
    }),
  });
  if (!created.ok) return created;
  return waitForTask({ connection, id: created.value.id });
}
