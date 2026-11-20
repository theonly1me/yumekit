import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import {
  createProject,
  type Output,
  type ProjectStore,
} from "@yumekit/project";
import { connectMediaTools, type MediaToolRequest } from "@yumekit/tools";
import { onTestFinished, vi } from "vitest";
import { createHarnessServer } from "../index.js";

export const sampleServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../../../../tools/sample-media/src/main.ts", import.meta.url),
    ),
  ],
};

export const smallOutput: Output = {
  id: "wide",
  label: "Wide",
  widthPixels: 320,
  heightPixels: 180,
};

export interface ToolCall {
  isError: boolean;
  data: Record<string, unknown>;
  text: string;
  result: CallToolResult;
}

export interface Harness {
  client: Client;
  store: ProjectStore;
  folder: string;
  runRequests: MediaToolRequest[];
  call: (request: {
    name: string;
    arguments?: Record<string, unknown>;
  }) => Promise<ToolCall>;
}

export async function startHarness(options?: {
  outputs?: Output[];
  mediaToolsFile?: object;
}): Promise<Harness> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-harness-"));
  const home = join(root, "home");
  await mkdir(home);
  vi.stubEnv("HOME", home);
  onTestFinished(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });
  const created = await createProject({
    folder: join(root, "project"),
    name: "Harness test",
    framesPerSecond: 30,
    outputs: options?.outputs ?? [smallOutput],
  });
  if (!created.ok) throw new Error(created.failure.message);
  const store = created.value;
  if (options?.mediaToolsFile !== undefined) {
    await writeFile(
      join(store.folder, "media-tools.json"),
      JSON.stringify(options.mediaToolsFile),
    );
  }
  const connected = await connectMediaTools({
    projectFolder: store.folder,
    bundledServers: { sample: sampleServerCommand },
  });
  if (!connected.ok) throw new Error(connected.failure.message);
  const mediaTools = connected.value;
  const runRequests: MediaToolRequest[] = [];
  const server = createHarnessServer({
    store,
    mediaTools: {
      ...mediaTools,
      run: (request) => {
        runRequests.push(request);
        return mediaTools.run(request);
      },
    },
  });
  const client = new Client({ name: "harness-test", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  onTestFinished(async () => {
    await client.close();
    await mediaTools.close();
  });
  return {
    client,
    store,
    folder: store.folder,
    runRequests,
    call: async (request) => {
      const result: CallToolResult = CallToolResultSchema.parse(
        await client.callTool(request, undefined, { timeout: 120_000 }),
      );
      const text = result.content
        .map((content) => (content.type === "text" ? content.text : ""))
        .join("\n");
      return {
        isError: result.isError === true,
        data: { ...result.structuredContent },
        text,
        result,
      };
    },
  };
}
