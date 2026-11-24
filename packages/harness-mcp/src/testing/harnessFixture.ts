import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { ProjectStore } from "@yumekit/project";
import type { MediaToolRequest } from "@yumekit/tools";
import { onTestFinished } from "vitest";
import { createHarnessServer } from "../index.js";
import {
  scriptedCritic,
  type CriticLog,
  type CriticScript,
} from "./criticFixture.js";
import {
  startHarnessProject,
  type HarnessProjectOptions,
} from "./harnessProject.js";

export { sampleServerCommand, smallOutput } from "./harnessProject.js";

export const progressServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../tools/src/testing/progressMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
};

export const keyedServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../tools/src/testing/keyedMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
  passEnvironment: ["YUMEKIT_TEST_KEY"],
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
  criticLog: CriticLog;
  call: (request: {
    name: string;
    arguments?: Record<string, unknown>;
  }) => Promise<ToolCall>;
}

export async function startHarness(
  options?: HarnessProjectOptions & { critic?: CriticScript | "none" },
): Promise<Harness> {
  const { store, mediaTools, runRequests } = await startHarnessProject(options);
  const client = new Client({ name: "harness-test", version: "0.0.0" });
  const criticLog: CriticLog = { briefs: [], answers: [] };
  const critic = options?.critic ?? {};
  const server = createHarnessServer({
    store,
    mediaTools,
    ...(critic === "none"
      ? {}
      : {
          askCritic: scriptedCritic({
            call: async (request) => {
              const result = CallToolResultSchema.parse(
                await client.callTool(request, undefined, { timeout: 120_000 }),
              );
              return {
                isError: result.isError === true,
                text: result.content
                  .map((part) => (part.type === "text" ? part.text : ""))
                  .join("\n"),
              };
            },
            script: critic,
            log: criticLog,
          }),
        }),
  });
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
    criticLog,
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
