import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { onTestFinished } from "vitest";
import { z } from "zod";
import { createCodexImagesServer } from "../createCodexImagesServer.ts";

export interface FakeCodexScenario {
  signIn: "chatgpt" | "api-key" | "none";
  hasFeature: boolean;
  turn: "picture" | "no-file" | "not-a-picture" | "usage-limit" | "hang";
  width: number;
  height: number;
  waitMilliseconds: number;
}

const fakeCodexFile = fileURLToPath(new URL("./fakeCodex.ts", import.meta.url));

const runSchema = z.object({
  arguments: z.array(z.string()),
  folder: z.string(),
  codexHome: z.string(),
  threadId: z.string(),
});

export async function connectCodexImages(options: {
  scenario?: Partial<FakeCodexScenario>;
  installed?: boolean;
  turnLimitSeconds?: number;
}) {
  const root = await mkdtemp(join(tmpdir(), "yumekit-fake-codex-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const scenarioFile = join(root, "scenario.json");
  await writeFile(
    scenarioFile,
    JSON.stringify({
      signIn: "chatgpt",
      hasFeature: true,
      turn: "picture",
      width: 1536,
      height: 1024,
      waitMilliseconds: 0,
      ...options.scenario,
    }),
  );
  const programPath = join(root, "codex");
  await writeFile(
    programPath,
    `#!/bin/sh\nexec "${process.execPath}" "${fakeCodexFile}" "$@"\n`,
  );
  await chmod(programPath, 0o755);
  const codexHome = join(root, "codex-home");
  const outputDirectory = join(root, "output");
  await mkdir(codexHome);
  const server = createCodexImagesServer({
    findProgram: () =>
      Promise.resolve(options.installed === false ? undefined : programPath),
    environment: {
      ...process.env,
      CODEX_HOME: codexHome,
      YUMEKIT_FAKE_CODEX_SCENARIO: scenarioFile,
    },
    codexHome,
    turnLimitSeconds: options.turnLimitSeconds ?? 20,
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const callTool = async (call: {
    name: string;
    input?: Record<string, unknown>;
  }) =>
    CallToolResultSchema.parse(
      await client.callTool(
        { name: call.name, arguments: call.input ?? {} },
        undefined,
        { timeout: 60_000 },
      ),
    );
  return {
    codexHome,
    outputDirectory,
    callTool,
    makePicture: (input: Record<string, unknown> = {}) =>
      callTool({
        name: "generate_image",
        input: {
          prompt: "a red mug",
          output_directory: outputDirectory,
          file_stem: "mug",
          ...input,
        },
      }),
    runs: async () =>
      (await readFile(`${scenarioFile}.runs.jsonl`, "utf8"))
        .trim()
        .split("\n")
        .map((line) => runSchema.parse(JSON.parse(line))),
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}
