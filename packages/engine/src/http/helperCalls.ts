import { harnessFailureResult, type HarnessResult } from "@yumekit/harness-mcp";
import type { HelperCall } from "../chat/helpers/helperDesk.js";
import { isHelperTool } from "../chat/helpers/helperScope.js";
import type { Exchange } from "./exchange.js";

export const helperHeader = "x-yumekit-helper";

export function helperTokenOf(exchange: Exchange): string | undefined {
  const value = exchange.request.headers[helperHeader];
  return typeof value === "string" ? value : undefined;
}

export function toolsFor<Tool extends { name: string }>(options: {
  exchange: Exchange;
  tools: Tool[];
}): Tool[] {
  return helperTokenOf(options.exchange) === undefined
    ? options.tools
    : options.tools.filter((tool) => isHelperTool(tool.name));
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
