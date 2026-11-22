import { z } from "zod";
import type {
  ClientFailure,
  EngineClient,
  Reply,
} from "../engine/engineClient.js";
import type { ToolResult } from "../engine/snapshot.js";

export interface FailureIssue {
  path: (string | number)[];
  message: string;
}

export type CallOutcome =
  | { kind: "done"; result: ToolResult }
  | {
      kind: "rejected";
      message: string;
      hint: string | undefined;
      issues: FailureIssue[];
      failureKind?: string;
    };

const toolFailureSchema = z.object({
  kind: z.string().optional(),
  message: z.string(),
  hint: z.string().optional(),
  issues: z
    .array(
      z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
      }),
    )
    .optional(),
});

const queues = new WeakMap<EngineClient, Promise<unknown>>();

export function clientFailureText(failure: ClientFailure): string {
  switch (failure.kind) {
    case "token-rejected":
      return "The engine did not accept this link. Open the link from yumekit open again.";
    case "engine-unreachable":
      return "The engine is not reachable. Check that yumekit open still runs.";
    case "request-failed":
      return failure.message;
  }
}

function outcomeOf(reply: Reply<ToolResult>): CallOutcome {
  if (!reply.ok) {
    return {
      kind: "rejected",
      message: clientFailureText(reply.failure),
      hint: undefined,
      issues: [],
    };
  }
  if (!reply.value.isError) return { kind: "done", result: reply.value };
  const failure = toolFailureSchema.safeParse(reply.value.data);
  if (!failure.success) {
    return {
      kind: "rejected",
      message: reply.value.text,
      hint: undefined,
      issues: [],
    };
  }
  const { message, hint, issues = [] } = failure.data;
  return {
    kind: "rejected",
    message,
    hint,
    issues,
    ...(failure.data.kind === undefined
      ? {}
      : { failureKind: failure.data.kind }),
  };
}

export function callInOrder(options: {
  client: EngineClient;
  name: string;
  input: object;
}): Promise<CallOutcome> {
  const { client, name, input } = options;
  const previous = queues.get(client) ?? Promise.resolve();
  const call = previous
    .catch(() => undefined)
    .then(() => client.callTool({ name, input }))
    .then(outcomeOf);
  queues.set(client, call);
  return call;
}
