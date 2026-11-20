import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, onTestFinished } from "vitest";
import { builtMainFile, createCliWorkspace } from "../testing/runCli.js";

async function connectToMcp(options: {
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

describe("yumekit mcp", () => {
  it("serves the harness over stdio with the bundled sample server and nothing else on stdout", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder]);

    const { client, transportErrors } = await connectToMcp({
      folder,
      environment: workspace.environment,
    });
    const { tools } = await client.listTools();
    const media = CallToolResultSchema.parse(
      await client.callTool({ name: "list_media_tools" }),
    );
    const project = CallToolResultSchema.parse(
      await client.callTool({ name: "get_project" }),
    );

    expect(tools).toHaveLength(29);
    expect(client.getInstructions()).toContain("get_scene_guide");
    expect(media.structuredContent).toMatchObject({
      servers: [{ server: "sample" }],
    });
    expect(project.structuredContent).toMatchObject({
      name: "project",
      frames_per_second: 30,
    });
    expect(transportErrors).toEqual([]);
  });

  it("prints each media server that failed to start, with its reason, to stderr", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder]);
    await writeFile(
      join(folder, "media-tools.json"),
      JSON.stringify({
        mcpServers: {
          broken: { command: "yumekit-no-such-command", args: [] },
        },
      }),
    );

    const connection = await connectToMcp({
      folder,
      environment: workspace.environment,
    });
    await connection.client.listTools();

    expect(connection.stderr()).toContain(
      'yumekit: the media server "broken" did not start',
    );
  });

  it("exits with 1 and the reason when the folder is not a project", async () => {
    const workspace = await createCliWorkspace();

    const run = await workspace.run(["mcp", "--project", workspace.root]);

    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("has no project.json file");
  });
});
