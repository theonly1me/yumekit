import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { JsonObject } from "@yumekit/tools";
import { jsonObjectInput } from "../inputs.js";
import { failureResult, type HarnessFailure } from "../results.js";

export interface HarnessImage {
  mimeType: string;
  base64: string;
}

export interface HarnessResult {
  isError: boolean;
  text: string;
  data: JsonObject;
  images: HarnessImage[];
  mcpResult: CallToolResult;
}

export function jsonObjectOf(value: object): JsonObject {
  return jsonObjectInput.parse(JSON.parse(JSON.stringify(value)));
}

export function harnessResultOf(result: CallToolResult): HarnessResult {
  return {
    isError: result.isError === true,
    text: result.content
      .flatMap((content) => (content.type === "text" ? [content.text] : []))
      .join("\n"),
    data: jsonObjectOf(result.structuredContent ?? {}),
    images: result.content.flatMap((content) =>
      content.type === "image"
        ? [{ mimeType: content.mimeType, base64: content.data }]
        : [],
    ),
    mcpResult: result,
  };
}

export function harnessFailureResult(failure: HarnessFailure): HarnessResult {
  return harnessResultOf(failureResult(failure));
}
