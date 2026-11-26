import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
  type Progress,
} from "@modelcontextprotocol/sdk/types.js";
import { createGeminiMediaServer } from "../createGeminiMediaServer.ts";
import { onTestFinished } from "vitest";

export const placeholderKey = "placeholder-gemini-key-7f3a";

export interface GeminiMediaConnection {
  callTool: (call: {
    name: string;
    arguments: Record<string, unknown>;
  }) => Promise<CallToolResult>;
  listToolNames: () => Promise<string[]>;
  requests: Request[];
  waits: number[];
  progress: Progress[];
}

export async function connectGeminiMedia(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
}): Promise<GeminiMediaConnection> {
  const requests: Request[] = [];
  const waits: number[] = [];
  const progress: Progress[] = [];
  const server = createGeminiMediaServer({
    environment: options.environment,
    sendRequest: (request) => {
      requests.push(request.clone());
      return options.respond(request);
    },
    wait: (seconds) => {
      waits.push(seconds);
      return Promise.resolve();
    },
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    requests,
    waits,
    progress,
    callTool: async (call) =>
      CallToolResultSchema.parse(
        await client.callTool(call, undefined, {
          onprogress: (update) => progress.push(update),
        }),
      ),
    listToolNames: async () =>
      (await client.listTools()).tools.map((tool) => tool.name),
  };
}

export function inOrder(
  responses: (() => Response)[],
): (request: Request) => Promise<Response> {
  const remaining = [...responses];
  return () => {
    const next = remaining.shift();
    if (!next) return Promise.reject(new Error("No response is left"));
    return Promise.resolve(next());
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

export async function temporaryFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-gemini-media-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  return folder;
}

export async function outputDirectory(): Promise<string> {
  return join(await temporaryFolder(), "assets");
}
