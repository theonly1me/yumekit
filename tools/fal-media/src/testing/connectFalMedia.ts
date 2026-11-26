import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
import { onTestFinished } from "vitest";

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

export async function temporaryFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-fal-media-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  return folder;
}

export async function writeImage(options: {
  folder: string;
  name: string;
}): Promise<string> {
  const path = join(options.folder, options.name);
  await writeFile(path, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return path;
}

export function fakeWav(seconds: number): Buffer {
  const sampleRate = 8000;
  const dataBytes = Math.round(seconds * sampleRate) * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "latin1");
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVEfmt ", 8, "latin1");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "latin1");
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.alloc(dataBytes)]);
}

export async function writeVoice(options: {
  folder: string;
  seconds: number;
}): Promise<string> {
  const path = join(options.folder, "voice.wav");
  await writeFile(path, fakeWav(options.seconds));
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
