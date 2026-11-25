import type { MediaRequestRecord } from "@yumekit/tools";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { failureResult, successResult } from "../results.js";

const mostShown = 50;

const listMediaRequestsInput = {
  count: z
    .int()
    .min(1)
    .max(mostShown)
    .optional()
    .describe(
      `How many requests to give, the newest first. 20 by default, at most ${String(mostShown)}.`,
    ),
  failed_only: z
    .boolean()
    .optional()
    .describe("true gives only the requests that failed."),
};

function serviceOf(record: MediaRequestRecord): string {
  const server = record.server ?? "no service";
  return record.model === undefined ? server : `${server} ${record.model}`;
}

function resultOf(record: MediaRequestRecord): string {
  if (record.failure !== undefined) {
    return `failed with ${record.failure.kind}: ${record.failure.message.replace(/[.\s]+$/, "")}`;
  }
  return `made ${(record.files ?? []).join(", ")}`;
}

function promptOf(record: MediaRequestRecord): string {
  if (record.prompt_from_you === undefined) return "";
  return ` Prompt as sent: ${String(record.prompt_from_you.length)} characters.`;
}

function lineOf(record: MediaRequestRecord): string {
  const shot = record.shot_id === undefined ? "" : ` (shot ${record.shot_id})`;
  const cost =
    record.usd === undefined ? "" : ` ${record.usd.toFixed(2)} US dollars.`;
  return `- ${record.at} ${record.asset_id}${shot}, ${record.capability}, ${serviceOf(record)}: ${resultOf(record)}.${cost}${promptOf(record)}`;
}

export function registerListMediaRequests(context: HarnessContext): void {
  context.tools.add({
    name: "list_media_requests",
    description:
      "List the requests of this project to picture, voice, music, and video services, the newest first, also the failed ones: the time, the asset id, the shot, the service and model, the pictures sent, the prompt as sent (prompt_from_you, exactly as you wrote it), the settings, the cost, and the result or the failure. The person sees the same list in Files, under Requests. Use it to find why a call failed, or what a model really got.",
    inputSchema: listMediaRequestsInput,
    annotations: { readOnlyHint: true },
    run: async ({ input }) => {
      const read = await context.mediaTools.requests();
      if (!read.ok) {
        return failureResult({
          kind: read.failure.kind,
          message: `The record of requests ${read.failure.file} is not valid: ${read.failure.message}`,
          hint: "Tell the person that the record of requests is damaged. Media calls still work, and yumekit starts to record again when the person removes the file.",
        });
      }
      const all = read.value;
      const failedCount = all.filter(
        (record) => record.failure !== undefined,
      ).length;
      const chosen = (
        input.failed_only === true
          ? all.filter((record) => record.failure !== undefined)
          : all
      ).slice(0, input.count ?? 20);
      return successResult({
        line: [
          `Media requests in this project: ${String(all.length)}, of which ${String(failedCount)} failed. The newest first:`,
          ...chosen.map(lineOf),
        ].join("\n"),
        data: { total: all.length, failed: failedCount, requests: chosen },
      });
    },
  });
}
