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
import { createSandMediaServer } from "../createSandMediaServer.ts";
import { onTestFinished } from "vitest";

export const placeholderKey = "sand-test-key-not-real-5d21";

export async function connectSandMedia(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
}) {
  const requests: Request[] = [];
  const waits: number[] = [];
  const progress: Progress[] = [];
  const server = createSandMediaServer({
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
    callTool: async (call: {
      name: string;
      arguments: Record<string, unknown>;
    }): Promise<CallToolResult> =>
      CallToolResultSchema.parse(
        await client.callTool(call, undefined, {
          onprogress: (update) => progress.push(update),
        }),
      ),
    inputFieldsOf: async (toolName: string) => {
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
  const folder = await mkdtemp(join(tmpdir(), "yumekit-sand-media-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  return folder;
}

export async function writePicture(options: {
  folder: string;
  name: string;
  text: string;
}): Promise<string> {
  const path = join(options.folder, options.name);
  await writeFile(path, options.text);
  return path;
}

export async function bodyOf(request: Request | undefined): Promise<unknown> {
  if (request === undefined) throw new Error("No request was sent");
  return request.clone().json();
}
