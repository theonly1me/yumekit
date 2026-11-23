import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { createLocalMusicServer } from "../createLocalMusicServer.ts";
import { styleEntries, type StyleEntry } from "../styles/styleList.ts";

export async function connectLocalMusic(options: {
  styles?: readonly StyleEntry[];
  withWaitingStyles: boolean;
}) {
  const server = createLocalMusicServer({
    styles: options.styles ?? styleEntries,
    withWaitingStyles: options.withWaitingStyles,
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const folder = await mkdtemp(join(tmpdir(), "yumekit-local-music-"));
  return {
    folder,
    toolNames: async () =>
      (await client.listTools()).tools.map((tool) => tool.name),
    callTool: async (call: {
      name: string;
      arguments: Record<string, unknown>;
    }) => CallToolResultSchema.parse(await client.callTool(call)),
    makeMusic: async (input: Record<string, unknown>) =>
      CallToolResultSchema.parse(
        await client.callTool({
          name: "generate_music",
          arguments: {
            prompt: "music for a product video",
            output_directory: folder,
            file_stem: "music",
            ...input,
          },
        }),
      ),
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

export function filePathOf(result: CallToolResult): string {
  const files = result.structuredContent?.["files"];
  if (!Array.isArray(files)) throw new Error(resultText(result));
  const first: unknown = files[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("path" in first) ||
    typeof first.path !== "string"
  ) {
    throw new Error("The result has no file");
  }
  return first.path;
}
