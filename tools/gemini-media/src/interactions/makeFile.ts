import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SendRequest } from "../geminiApi.ts";
import { writeOutputFile, type Outcome } from "../toolResults.ts";
import {
  fileExtensionOf,
  type Interaction,
  type OutputPartType,
} from "./interaction.ts";
import { progressReporter, type ToolExtra } from "./progressReporter.ts";
import { requestOutput, type Wait } from "./requestOutput.ts";

export interface GeminiTools {
  server: McpServer;
  apiKey: string | undefined;
  sendRequest: SendRequest;
  wait: Wait;
}

export interface MadeFile {
  path: string;
  bytes: Buffer;
  mimeType: string;
  interaction: Interaction;
}

export async function makeFile(options: {
  tools: GeminiTools;
  apiKey: string;
  extra: ToolExtra;
  body: Record<string, unknown>;
  output: {
    type: OutputPartType;
    defaultMimeType: string;
    fallbackExtension: string;
  };
  outputDirectory: string;
  fileStem: string;
}): Promise<Outcome<MadeFile, string>> {
  const { tools, output } = options;
  const made = await requestOutput({
    body: options.body,
    output: { type: output.type, defaultMimeType: output.defaultMimeType },
    connection: {
      sendRequest: tools.sendRequest,
      apiKey: options.apiKey,
      wait: tools.wait,
      reportProgress: progressReporter(options.extra),
    },
  });
  if (!made.ok) return made;
  const written = await writeOutputFile({
    outputDirectory: options.outputDirectory,
    fileStem: options.fileStem,
    extension: fileExtensionOf({
      mimeType: made.value.mimeType,
      fallback: output.fallbackExtension,
    }),
    bytes: made.value.bytes,
  });
  if (!written.ok) return written;
  return { ok: true, value: { ...made.value, path: written.value } };
}
