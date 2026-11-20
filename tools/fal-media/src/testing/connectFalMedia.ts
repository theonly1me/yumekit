import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
  type Progress,
} from "@modelcontextprotocol/sdk/types.js";
import { createFalMediaServer } from "../createFalMediaServer.ts";

export const placeholderKey = "fal-test-key-not-real";

export interface FalMediaConnection {
  callTool: (call: {
    name: string;
    arguments: Record<string, unknown>;
    onProgress?: (progress: Progress) => void;
  }) => Promise<CallToolResult>;
  inputFieldsOf: (toolName: string) => Promise<string[]>;
  requests: Request[];
  waits: number[];
}

export async function connectFalMedia(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
}): Promise<FalMediaConnection> {
  const requests: Request[] = [];
  const waits: number[] = [];
  const server = createFalMediaServer({
    environment: options.environment,
    sendRequest: (request) => {
      requests.push(request.clone());
      return options.respond(request);
    },
    wait: ({ seconds }) => {
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
    callTool: async (call) =>
      CallToolResultSchema.parse(
        await client.callTool(
          { name: call.name, arguments: call.arguments },
          CallToolResultSchema,
          call.onProgress === undefined ? {} : { onprogress: call.onProgress },
        ),
      ),
    inputFieldsOf: async (toolName) => {
      const { tools } = await client.listTools();
      const tool = tools.find((entry) => entry.name === toolName);
      return Object.keys(tool?.inputSchema.properties ?? {});
    },
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

export function temporaryFolder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "yumekit-fal-media-"));
}

export async function writeImage(options: {
  folder: string;
  name: string;
}): Promise<string> {
  const path = join(options.folder, options.name);
  await writeFile(path, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return path;
}

export async function bodyOf(request: Request): Promise<unknown> {
  return request.clone().json();
}

export function requestsTo(options: {
  requests: Request[];
  prefix: string;
}): Request[] {
  return options.requests.filter((request) =>
    request.url.startsWith(options.prefix),
  );
}
