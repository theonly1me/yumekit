import { readFile, realpath, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createTestProject,
  startTestEngine,
  type TestEngine,
} from "../testing/engineFixture.js";
import { openEvents } from "../testing/eventsClient.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";

async function engineWithCommand() {
  const project = await createTestProject();
  vi.stubEnv("PATH", join(project.root, "bin"));
  const projectFolder = await realpath(project.projectFolder);
  const serverCommand = {
    command: "/usr/local/bin/node",
    args: ["/opt/yumekit/main.js", "mcp", "--project", projectFolder],
  };
  const engine = await startTestEngine({ projectFolder, serverCommand });
  return { projectFolder, serverCommand, engine };
}

async function agentsOf(engine: TestEngine): Promise<unknown> {
  const answer = await rawRequest({
    port: engine.port,
    path: "/api/agents",
    headers: withToken(engine),
  });
  return JSON.parse(answer.body);
}

function connect(options: { engine: TestEngine; agentId: string }) {
  return rawRequest({
    port: options.engine.port,
    path: `/api/agents/${options.agentId}/connect`,
    method: "POST",
    headers: withToken(options.engine),
  });
}

describe("the agent requests of the engine", () => {
  it("lists each agent with the server command, and writes the entry on a connect", async () => {
    const { engine, projectFolder, serverCommand } = await engineWithCommand();
    expect(await agentsOf(engine)).toMatchObject({
      connected: 0,
      serverCommand,
      agents: [
        { id: "claude-code", installed: false, configured: false },
        { id: "codex", installed: false, configured: false },
        { id: "cursor", installed: false, configured: false },
      ],
    });
    const answer = await connect({ engine, agentId: "claude-code" });
    expect(answer.status).toBe(200);
    expect(JSON.parse(answer.body)).toMatchObject({
      id: "claude-code",
      configured: true,
      start_command: "claude",
      configuration_file: join(projectFolder, ".mcp.json"),
    });
    expect(await readFile(join(projectFolder, ".mcp.json"), "utf8")).toContain(
      "/opt/yumekit/main.js",
    );
  });

  it("refuses an agent id that is not in the list, and a file that is not valid stays as it was", async () => {
    const { engine, projectFolder } = await engineWithCommand();
    const unknown = await connect({ engine, agentId: "gemini" });
    expect([unknown.status, JSON.parse(unknown.body)]).toEqual([
      404,
      expect.objectContaining({ kind: "agent-not-found" }),
    ]);
    await writeFile(join(projectFolder, ".mcp.json"), "{ not json");
    const invalid = await connect({ engine, agentId: "claude-code" });
    expect([invalid.status, JSON.parse(invalid.body)]).toEqual([
      409,
      expect.objectContaining({ kind: "configuration-not-valid" }),
    ]);
    expect(await readFile(join(projectFolder, ".mcp.json"), "utf8")).toBe(
      "{ not json",
    );
  });

  it("needs a server command for both requests", async () => {
    const { projectFolder } = await createTestProject();
    const engine = await startTestEngine({ projectFolder });
    for (const answer of [
      await rawRequest({
        port: engine.port,
        path: "/api/agents",
        headers: withToken(engine),
      }),
      await connect({ engine, agentId: "codex" }),
    ]) {
      expect(answer.status).toBe(409);
      expect(answer.body).toContain("yumekit open");
    }
  });

  it("counts each open agent connection and not the connection of the editor", async () => {
    const { engine } = await engineWithCommand();
    const editor = await openEvents(engine);
    const agent = await openEvents({ ...engine, isAgent: true });
    await editor.waitFor(
      (message) =>
        JSON.stringify(message) === '{"type":"agents-changed","connected":1}',
    );
    expect(await agentsOf(engine)).toMatchObject({ connected: 1 });
    agent.close();
    await editor.waitFor(
      (message) =>
        JSON.stringify(message) === '{"type":"agents-changed","connected":0}',
    );
    expect(await agentsOf(engine)).toMatchObject({ connected: 0 });
  });
});
