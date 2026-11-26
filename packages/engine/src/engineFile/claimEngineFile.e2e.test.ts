import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { startEngine } from "../startEngine.js";
import { createTestProject } from "../testing/engineFixture.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";

describe("the claim of engine.json", () => {
  it("gives one engine and one engine-already-running for two starts at the same moment", async () => {
    const { projectFolder } = await createTestProject();

    const results = await Promise.all([
      startEngine({ projectFolder }),
      startEngine({ projectFolder }),
    ]);
    const engines = results.flatMap((result) =>
      result.ok ? [result.value] : [],
    );
    for (const engine of engines) onTestFinished(() => engine.close());
    const failures = results.flatMap((result) =>
      result.ok ? [] : [result.failure],
    );
    const [engine] = engines;
    const content: unknown = JSON.parse(
      await readFile(join(projectFolder, ".yumekit", "engine.json"), "utf8"),
    );

    expect(engines).toHaveLength(1);
    expect(failures).toEqual([
      { kind: "engine-already-running", url: engine?.url },
    ]);
    expect(content).toMatchObject({ token: engine?.token });
  });

  it("gives exactly one engine for three starts at the same moment, and that engine answers", async () => {
    const { projectFolder } = await createTestProject();

    const results = await Promise.all([
      startEngine({ projectFolder }),
      startEngine({ projectFolder }),
      startEngine({ projectFolder }),
    ]);
    const engines = results.flatMap((result) =>
      result.ok ? [result.value] : [],
    );
    for (const engine of engines) onTestFinished(() => engine.close());
    const [engine] = engines;
    const port = Number(new URL(engine?.url ?? "http://x:1").port);
    const health = await rawRequest({
      port,
      path: "/api/health",
      headers: withToken({ token: engine?.token ?? "" }),
    });

    expect(engines).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(2);
    expect(health.status).toBe(200);
  });
});
