import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { onTestFinished } from "vitest";
import { builtMainFile } from "./runCli.js";

export async function connectToMcp(options: {
  folder: string;
  environment: NodeJS.ProcessEnv;
}) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [builtMainFile, "mcp", "--project", options.folder],
    env: Object.fromEntries(
      Object.entries(options.environment).flatMap(([name, value]) =>
        value === undefined ? [] : [[name, value]],
      ),
    ),
    stderr: "pipe",
  });
  const stderrChunks: string[] = [];
  transport.stderr?.on("data", (chunk: Buffer) => {
    stderrChunks.push(chunk.toString());
  });
  const transportErrors: Error[] = [];
  const client = new Client({ name: "cli-test", version: "0.0.0" });
  client.onerror = (error) => {
    transportErrors.push(error);
  };
  await client.connect(transport);
  onTestFinished(() => client.close());
  return { client, transportErrors, stderr: () => stderrChunks.join("") };
}
