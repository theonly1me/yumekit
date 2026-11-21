import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  ErrorCode,
  McpError,
  type Progress,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { isAbsolute, relative, resolve } from "node:path";
import { errorMessage } from "./errorMessage.js";
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

const requestTimeoutCode: number = ErrorCode.RequestTimeout;

function toolArguments(options: {
  request: MediaToolRequest;
  model: string | undefined;
}): JsonObject {
  const { request, model } = options;
  const input =
    model === undefined ? request.input : { ...request.input, model };
  if (!writesFiles(request.capability)) return input;
  return {
    ...input,
    output_directory: request.outputDirectory,
    file_stem: request.fileStem,
  };
}

export function textOfContent(content: unknown): string {
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

export function isTimeout(error: unknown): boolean {
  return error instanceof McpError && error.code === requestTimeoutCode;
}

function isInside(options: { directory: string; path: string }): boolean {
  const fromDirectory = relative(
    resolve(options.directory),
    resolve(options.path),
  );
  return (
    fromDirectory !== "" &&
    !fromDirectory.startsWith("..") &&
    !isAbsolute(fromDirectory)
  );
}

function pathsOutside(options: {
  result: MediaToolResult;
  outputDirectory: string;
}): string[] {
  return options.result.files
    .map((file) => file.path)
    .filter((path) => !isInside({ directory: options.outputDirectory, path }));
}

function progressOptionOf(request: MediaToolRequest): {
  onprogress?: (progress: Progress) => void;
} {
  const { onProgress } = request;
  if (onProgress === undefined) return {};
  return {
    onprogress: ({ progress, total, message }) => {
      onProgress({
        done: progress,
        ...(total === undefined ? {} : { total }),
        ...(message === undefined ? {} : { message }),
      });
    },
  };
}

export async function runTool(options: {
  server: string;
  client: Client;
  request: MediaToolRequest;
  model: string | undefined;
  toolTimeoutSeconds: number;
}): Promise<Outcome<MediaToolResult, MediaToolFailure>> {
  const { server, client, request, model, toolTimeoutSeconds } = options;
  let result: Awaited<ReturnType<Client["callTool"]>>;
  try {
    result = await client.callTool(
      {
        name: toolNameByCapability[request.capability],
        arguments: toolArguments({ request, model }),
      },
      undefined,
      {
        timeout: toolTimeoutSeconds * 1000,
        ...progressOptionOf(request),
      },
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
  const outside = pathsOutside({
    result: parsed.data,
    outputDirectory: request.outputDirectory,
  });
  if (outside.length > 0) {
    return {
      ok: false,
      failure: {
        kind: "media-tool-invalid-result",
        server,
        message: `Paths outside ${resolve(request.outputDirectory)}: ${outside.join(", ")}`,
      },
    };
  }
  return { ok: true, value: parsed.data };
}
