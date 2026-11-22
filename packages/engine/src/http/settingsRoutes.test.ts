import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  startedTestEngine,
  type TestEngine,
} from "../testing/engineFixture.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";

function putAgent(options: {
  engine: TestEngine;
  body: string;
  token?: string;
}) {
  return rawRequest({
    port: options.engine.port,
    path: "/api/settings/agent",
    method: "PUT",
    headers: withToken({
      token: options.token ?? options.engine.token,
      headers: { "content-type": "application/json" },
    }),
    body: options.body,
  });
}

async function settingsOf(configurationDirectory: string): Promise<unknown> {
  const text = await readFile(
    join(configurationDirectory, "settings.json"),
    "utf8",
  );
  return JSON.parse(text);
}

describe("the request that saves the agent of the chat", () => {
  it("saves the agent and keeps the other fields of the settings file", async () => {
    const { engine, configurationDirectory } = await startedTestEngine();
    await writeFile(
      join(configurationDirectory, "settings.json"),
      JSON.stringify({
        agent: "claude-code",
        agentPrograms: { codex: "/opt/codex" },
        projectsFolder: "/videos",
      }),
    );

    const answer = await putAgent({
      engine,
      body: JSON.stringify({ agent: "codex" }),
    });

    expect([answer.status, JSON.parse(answer.body)]).toEqual([
      200,
      { agent: "codex" },
    ]);
    expect(await settingsOf(configurationDirectory)).toEqual({
      agent: "codex",
      agentPrograms: { codex: "/opt/codex" },
      projectsFolder: "/videos",
    });
  });

  it("makes the settings file when it does not exist", async () => {
    const { engine, configurationDirectory } = await startedTestEngine();

    const answer = await putAgent({
      engine,
      body: JSON.stringify({ agent: "claude-code" }),
    });

    expect(answer.status).toBe(200);
    expect(await settingsOf(configurationDirectory)).toEqual({
      agent: "claude-code",
    });
  });

  it("saves Cursor, refuses an unknown agent, and leaves the file as it was", async () => {
    const { engine, configurationDirectory } = await startedTestEngine();
    await writeFile(
      join(configurationDirectory, "settings.json"),
      '{"agent":"codex"}',
    );

    const unknown = await putAgent({
      engine,
      body: JSON.stringify({ agent: "gemini" }),
    });
    expect([unknown.status, JSON.parse(unknown.body)]).toEqual([
      400,
      expect.objectContaining({ kind: "body-not-valid" }),
    ]);
    expect(await settingsOf(configurationDirectory)).toEqual({
      agent: "codex",
    });

    const cursor = await putAgent({
      engine,
      body: JSON.stringify({ agent: "cursor" }),
    });
    expect(cursor.status).toBe(200);
    expect(await settingsOf(configurationDirectory)).toEqual({
      agent: "cursor",
    });
  });

  it("does not write over a settings file that is not valid", async () => {
    const { engine, configurationDirectory } = await startedTestEngine();
    const file = join(configurationDirectory, "settings.json");
    await writeFile(file, "{ not json");

    const answer = await putAgent({
      engine,
      body: JSON.stringify({ agent: "codex" }),
    });

    expect([answer.status, JSON.parse(answer.body)]).toEqual([
      409,
      expect.objectContaining({ kind: "settings-not-valid" }),
    ]);
    expect(await readFile(file, "utf8")).toBe("{ not json");
  });

  it("needs the session token", async () => {
    const { engine, configurationDirectory } = await startedTestEngine();

    const answer = await putAgent({
      engine,
      token: "0".repeat(64),
      body: JSON.stringify({ agent: "codex" }),
    });

    expect(answer.status).toBe(401);
    await expect(
      readFile(join(configurationDirectory, "settings.json"), "utf8"),
    ).rejects.toThrow();
  });
});
