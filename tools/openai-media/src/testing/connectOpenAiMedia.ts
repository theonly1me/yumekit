import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { createOpenAiMediaServer } from "../createOpenAiMediaServer.ts";

export const placeholderKey = "not-a-real-key";

export interface OpenAiMediaConnection {
  callTool: (call: {
    name: string;
    arguments: Record<string, unknown>;
  }) => Promise<CallToolResult>;
  listToolNames: () => Promise<string[]>;
  requests: Request[];
}

export async function connectOpenAiMedia(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
}): Promise<OpenAiMediaConnection> {
  const requests: Request[] = [];
  const server = createOpenAiMediaServer({
    environment: options.environment,
    sendRequest: (request) => {
      requests.push(request.clone());
      return options.respond(request);
    },
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    requests,
    callTool: async (call) =>
      CallToolResultSchema.parse(await client.callTool(call)),
    listToolNames: async () =>
      (await client.listTools()).tools.map((tool) => tool.name),
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

export function fakePng(size: { width: number; height: number }): Buffer {
  const header = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(size.width, 16);
  header.writeUInt32BE(size.height, 20);
  return header;
}

export function imageResponse(png: Buffer): Promise<Response> {
  return Promise.resolve(
    Response.json({
      created: 1,
      data: [{ b64_json: png.toString("base64") }],
      usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    }),
  );
}

export function temporaryFolder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "yumekit-openai-media-"));
}
