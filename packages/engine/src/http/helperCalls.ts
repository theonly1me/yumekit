import {
  harnessFailureResult,
  isCriticTool,
  type HarnessResult,
} from "@yumekit/harness-mcp";
import type { HelperCall } from "../chat/helpers/helperDesk.js";
import { isHelperTool } from "../chat/helpers/helperScope.js";
import type { Exchange } from "./exchange.js";

export const helperHeader = "x-yumekit-helper";

export function helperTokenOf(exchange: Exchange): string | undefined {
  const value = exchange.request.headers[helperHeader];
  return typeof value === "string" ? value : undefined;
}

export function toolsFor<Tool extends { name: string }>(options: {
  call: HelperCall;
  tools: Tool[];
}): Tool[] {
  const { call, tools } = options;
  if (call.kind === "critic")
    return tools.filter((tool) => isCriticTool(tool.name));
  if (call.kind === "lead")
    return tools.filter((tool) => !isCriticTool(tool.name));
  return tools.filter((tool) => isHelperTool(tool.name));
}

export function helperRefusalOf(options: {
  helper: HelperCall;
  tool: string;
  input: Record<string, unknown>;
}): HarnessResult | undefined {
  const { helper, tool, input } = options;
  if (helper.kind === "ended") {
    return harnessFailureResult({
      kind: "helper-ended",
      message: "The work of this helper has ended.",
      hint: "Stop now, and give your answer to the lead.",
    });
  }
  if (helper.kind === "critic") {
    const refusal = helper.refusalOf({ tool });
    return refusal === undefined
      ? undefined
      : harnessFailureResult({
          kind: "critic-not-permitted",
          message: refusal,
          hint: "Look with view_for_review, then give your whole answer.",
        });
  }
  if (isCriticTool(tool)) {
    return harnessFailureResult({
      kind: "critic-only",
      message: `Only the critic that a review starts (review_plan, review_sheet, review_start, review_clip) can call ${tool}.`,
      hint: "Call the review tool. The critic gives the verdict.",
    });
  }
  const refusal =
    helper.kind === "helper" ? helper.refusalOf({ tool, input }) : undefined;
  return refusal === undefined
    ? undefined
    : harnessFailureResult({
        kind: "helper-not-permitted",
        message: refusal,
        hint: "Do only the work of the brief. Tell the lead what else the video needs.",
      });
}
