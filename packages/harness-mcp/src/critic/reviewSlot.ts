import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import type { WorkStart, WorkTicket } from "../work/board/workBoard.js";

export type ReviewSubject = Pick<
  WorkStart,
  "id" | "what" | "subject" | "shotId" | "castId"
>;

export async function inReviewSlot(options: {
  context: HarnessContext;
  subject: ReviewSubject;
  run: (ticket: WorkTicket) => Promise<CallToolResult>;
}): Promise<CallToolResult> {
  const started = options.context.board.start({
    ...options.subject,
    kind: "review",
    state: "waiting",
    videoSeconds: 0,
  });
  if (!started.ok) return failureResult(started.failure);
  try {
    return await options.run(started.value);
  } finally {
    started.value.finish();
  }
}
