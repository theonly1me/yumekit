import { describe, expect, it } from "vitest";
import { startedTestEngine } from "./testing/engineFixture.js";
import {
  bodyOf,
  previewOriginOf,
  rawRequest,
  textFieldOf,
  withToken,
} from "./testing/rawRequest.js";

const wrongToken = "0".repeat(64);

describe("the request checks of the engine", () => {
  it("answers the health request that has the token in the header", async () => {
    const { engine, projectFolder } = await startedTestEngine();

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/health",
      headers: withToken(engine),
    });

    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toMatchObject({ name: "yumekit" });
    expect(textFieldOf({ answer, name: "projectFolder" })).toMatch(
      new RegExp(`${projectFolder.split("/").at(-1) ?? ""}$`),
    );
    expect(answer.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rejects with 401 a request with no token, a wrong token, or the token only in the query", async () => {
    const { engine } = await startedTestEngine();

    const statuses = await Promise.all([
      rawRequest({ port: engine.port, path: "/api/health" }),
      rawRequest({
        port: engine.port,
        path: "/api/health",
        headers: withToken({ token: wrongToken }),
      }),
      rawRequest({
        port: engine.port,
        path: "/api/health",
        headers: withToken({ token: engine.token.slice(0, 63) }),
      }),
      rawRequest({
        port: engine.port,
        path: `/api/health?token=${engine.token}`,
      }),
      rawRequest({
        port: engine.port,
        path: "/api/project",
        headers: { authorization: engine.token },
      }),
    ]);

    expect(statuses.map((answer) => answer.status)).toEqual([
      401, 401, 401, 401, 401,
    ]);
    expect(
      statuses.map((answer) => textFieldOf({ answer, name: "kind" })),
    ).toEqual([
      "token-missing",
      "token-not-valid",
      "token-not-valid",
      "token-missing",
      "token-missing",
    ]);
  });

  it("rejects with 403 a request with the token and a Host header that is not the engine", async () => {
    const { engine } = await startedTestEngine();

    const hosts = [
      "evil.example:80",
      `evil.example:${String(engine.port)}`,
      `127.0.0.1:${String(engine.port + 1)}`,
      "127.0.0.1",
    ];
    const answers = await Promise.all(
      hosts.map((host) =>
        rawRequest({
          port: engine.port,
          path: "/api/health",
          headers: withToken({ token: engine.token, headers: { host } }),
        }),
      ),
    );
    const localhost = await rawRequest({
      port: engine.port,
      path: "/api/health",
      headers: withToken({
        token: engine.token,
        headers: { host: `localhost:${String(engine.port)}` },
      }),
    });

    expect(answers.map((answer) => answer.status)).toEqual([
      403, 403, 403, 403,
    ]);
    expect(
      answers.map((answer) => textFieldOf({ answer, name: "kind" })),
    ).toEqual(Array.from(hosts, () => "host-not-permitted"));
    expect(localhost.status).toBe(200);
  });

  it("rejects with 403 a request with the token from a foreign origin or from the preview page origin", async () => {
    const { engine } = await startedTestEngine();
    const previewOrigin = await previewOriginOf(engine);

    const origins = ["https://evil.example", "null", previewOrigin];
    const answers = await Promise.all(
      origins.map((origin) =>
        rawRequest({
          port: engine.port,
          path: "/api/project",
          headers: withToken({ token: engine.token, headers: { origin } }),
        }),
      ),
    );
    const ownOrigin = await rawRequest({
      port: engine.port,
      path: "/api/project",
      headers: withToken({
        token: engine.token,
        headers: { origin: engine.origin },
      }),
    });

    expect(previewOrigin).not.toBe(engine.origin);
    expect(answers.map((answer) => answer.status)).toEqual([403, 403, 403]);
    expect(
      answers.map((answer) => textFieldOf({ answer, name: "kind" })),
    ).toEqual([
      "origin-not-permitted",
      "origin-not-permitted",
      "origin-not-permitted",
    ]);
    expect(ownOrigin.status).toBe(200);
  });

  it("rejects a tool call from the preview page origin before the tool runs", async () => {
    const { engine } = await startedTestEngine();
    const previewOrigin = await previewOriginOf(engine);

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/tools/set_script",
      method: "POST",
      headers: withToken({
        token: engine.token,
        headers: { origin: previewOrigin },
      }),
      body: JSON.stringify({ input: { script: "changed" } }),
    });
    const project = await rawRequest({
      port: engine.port,
      path: "/api/project",
      headers: withToken(engine),
    });

    expect(answer.status).toBe(403);
    expect(bodyOf(project)).toMatchObject({ script: "" });
  });
});
