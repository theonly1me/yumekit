import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startEngine } from "../startEngine.js";
import {
  createTestProject,
  startTestEngine,
} from "../testing/engineFixture.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";

const engineFileOf = (projectFolder: string) =>
  join(projectFolder, ".yumekit", "engine.json");

async function isPresent(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("one engine for one project", () => {
  it("writes engine.json with the port, the token, and the process id, readable only by the user", async () => {
    const { projectFolder } = await createTestProject();
    const engine = await startTestEngine({ projectFolder });

    const file = engineFileOf(projectFolder);
    const content: unknown = JSON.parse(await readFile(file, "utf8"));

    expect(content).toEqual({
      port: engine.port,
      token: engine.token,
      processId: process.pid,
    });
    expect((await stat(file)).mode & 0o777).toBe(0o600);
    expect(engine.token).toMatch(/^[0-9a-f]{64}$/);
    expect(engine.url).toBe(
      `http://127.0.0.1:${String(engine.port)}/?token=${engine.token}`,
    );
  });

  it("removes engine.json when it closes", async () => {
    const { projectFolder } = await createTestProject();
    const engine = await startTestEngine({ projectFolder });

    await engine.close();

    expect(await isPresent(engineFileOf(projectFolder))).toBe(false);
  });

  it("returns engine-already-running with the URL for a second start on the same folder", async () => {
    const { projectFolder } = await createTestProject();
    const engine = await startTestEngine({ projectFolder });

    const second = await startEngine({ projectFolder });

    expect(second).toEqual({
      ok: false,
      failure: { kind: "engine-already-running", url: engine.url },
    });
    const health = await rawRequest({
      port: engine.port,
      path: "/api/health",
      headers: withToken(engine),
    });
    expect(health.status).toBe(200);
  });

  it("replaces a stale engine.json whose engine does not answer", async () => {
    const { projectFolder } = await createTestProject();
    await mkdir(join(projectFolder, ".yumekit"), { recursive: true });
    const stale = { port: 9, token: "a".repeat(64), processId: 999_999 };
    await writeFile(engineFileOf(projectFolder), JSON.stringify(stale));

    const engine = await startTestEngine({ projectFolder });
    const content: unknown = JSON.parse(
      await readFile(engineFileOf(projectFolder), "utf8"),
    );

    expect(content).toMatchObject({ token: engine.token, port: engine.port });
    expect(engine.token).not.toBe(stale.token);
  });

  it("makes a new token for each start", async () => {
    const { projectFolder } = await createTestProject();
    const first = await startTestEngine({ projectFolder });
    await first.close();

    const second = await startTestEngine({ projectFolder });

    expect(second.token).not.toBe(first.token);
  });

  it("returns port-not-free for a port that another program holds", async () => {
    const { projectFolder } = await createTestProject();
    const holder = createServer();
    const port = await new Promise<number>((resolve) => {
      holder.listen({ host: "127.0.0.1", port: 0 }, () => {
        const address = holder.address();
        resolve(
          typeof address === "object" && address !== null ? address.port : 0,
        );
      });
    });

    const started = await startEngine({ projectFolder, port });
    holder.close();

    expect(started).toEqual({
      ok: false,
      failure: { kind: "port-not-free", port },
    });
    expect(await isPresent(engineFileOf(projectFolder))).toBe(false);
  });

  it("returns project-invalid for a folder that is not a project", async () => {
    const { root } = await createTestProject();

    const started = await startEngine({ projectFolder: join(root, "config") });

    expect(started).toMatchObject({
      ok: false,
      failure: { kind: "project-invalid" },
    });
  });
});
