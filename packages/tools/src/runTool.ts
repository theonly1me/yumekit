import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { errorMessage } from "./connectServer.js";
import {
  mediaToolResultSchema,
  toolNameByCapability,
  writesFiles,
  type MediaToolResult,
} from "./convention.js";
import type {
  JsonObject,
  MediaToolFailure,
  MediaToolRequest,
  Outcome,
} from "./types.js";

const toolTimeoutSeconds = 600;
const requestTimeoutCode: number = ErrorCode.RequestTimeout;

function toolArguments(request: MediaToolRequest): JsonObject {
  if (!writesFiles(request.capability)) return request.input;
  return {
    ...request.input,
    output_directory: request.outputDirectory,
    file_stem: request.fileStem,
  };
}

function textOfContent(content: unknown): string {
  const items = z
    .array(z.object({ type: z.string(), text: z.string().optional() }))
    .safeParse(content);
  if (!items.success) return "The media tool failed with no message";
  const text = items.data
    .map((item) => item.text ?? "")
    .filter(Boolean)
    .join("\n");
  return text || "The media tool failed with no message";
}

function isTimeout(error: unknown): boolean {
  return error instanceof McpError && error.code === requestTimeoutCode;
}

export async function runTool(options: {
  server: string;
  client: Client;
  request: MediaToolRequest;
}): Promise<Outcome<MediaToolResult, MediaToolFailure>> {
  const { server, client, request } = options;
  let result: Awaited<ReturnType<Client["callTool"]>>;
  try {
    result = await client.callTool(
      {
        name: toolNameByCapability[request.capability],
        arguments: toolArguments(request),
      },
      undefined,
      { timeout: toolTimeoutSeconds * 1000 },
    );
  } catch (error) {
    if (isTimeout(error)) {
      return {
        ok: false,
        failure: {
          kind: "media-tool-timeout",
          server,
          timeoutSeconds: toolTimeoutSeconds,
        },
      };
    }
    return {
      ok: false,
      failure: {
        kind: "media-tool-failed",
        server,
        message: errorMessage(error),
      },
    };
  }
  if (result.isError === true) {
    return {
      ok: false,
      failure: {
        kind: "media-tool-failed",
        server,
        message: textOfContent(result.content),
      },
    };
  }
  const parsed = mediaToolResultSchema.safeParse(result.structuredContent);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        kind: "media-tool-invalid-result",
        server,
        message: z.prettifyError(parsed.error),
      },
    };
  }
  return { ok: true, value: parsed.data };
}
