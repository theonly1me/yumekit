import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTestProject } from "../testing/engineFixture.js";
import { rawRequest } from "../testing/rawRequest.js";
import { startTestHome } from "./testing/homeFixture.js";

const createBody = {
  request: "A short video about tea.",
  platform_ids: ["youtube"],
  length: 15,
};

describe("the request checks of the home server", () => {
  it("refuses a request with no token, so another program cannot make a project", async () => {
    const test = await startTestHome({ agent: "none" });

    const answer = await rawRequest({
      port: test.port,
      path: "/api/home/projects",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createBody),
    });

    expect(answer.status).toBe(401);
    expect(await readdir(test.root)).not.toContain("projects");
  });

  it("refuses a request from another site, also with the token", async () => {
    const test = await startTestHome({ agent: "none" });

    const fromOrigin = await test.send({
      path: "/api/home/projects",
      body: createBody,
      headers: { origin: "http://example.com" },
    });
    const fromHost = await test.send({
      path: "/api/home",
      headers: { host: "example.com" },
    });

    expect(fromOrigin.status).toBe(403);
    expect(JSON.parse(fromOrigin.body)).toMatchObject({
      kind: "origin-not-permitted",
    });
    expect(fromHost.status).toBe(403);
    expect(await readdir(test.root)).not.toContain("projects");
  });

  it("opens no folder that is not in the recent list, also a real project", async () => {
    const test = await startTestHome({ agent: "none" });
    const other = await createTestProject();

    const answer = await test.send({
      path: "/api/home/open",
      body: { folder: other.projectFolder },
    });

    expect(answer.status).toBe(404);
    expect(JSON.parse(answer.body)).toMatchObject({
      kind: "project-not-recent",
    });
  });

  it("keeps a new project inside the projects folder when the request names another path", async () => {
    const test = await startTestHome({ agent: "none" });

    const answer = await test.send({
      path: "/api/home/projects",
      body: { ...createBody, request: "../../../etc/passwd and /tmp/x" },
    });

    expect(answer.status).toBe(200);
    expect(JSON.parse(answer.body)).toMatchObject({
      folder: join(test.projectsFolder, "etc-passwd-and-tmp-x"),
    });
    expect(await readdir(test.root)).toEqual([
      "config",
      "fake-agent",
      "projects",
    ]);
  });

  it("refuses a body with a platform out of the catalog, no platform, a wrong length, or a long request", async () => {
    const test = await startTestHome({ agent: "none" });
    const bodies = [
      { ...createBody, platform_ids: ["myspace"] },
      { ...createBody, platform_ids: [] },
      { ...createBody, length: 45 },
      { ...createBody, request: "tea ".repeat(1_001) },
      { ...createBody, request: "   " },
    ];

    const statuses = await Promise.all(
      bodies.map(async (body) => {
        const answer = await test.send({ path: "/api/home/projects", body });
        return answer.status;
      }),
    );

    expect(statuses).toEqual([400, 400, 400, 400, 400]);
    expect(await readdir(test.root)).not.toContain("projects");
  });
});
