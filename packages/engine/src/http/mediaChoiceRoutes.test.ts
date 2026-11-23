import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  startedTestEngine,
  type TestEngine,
} from "../testing/engineFixture.js";
import {
  bodyOf,
  callTool,
  rawRequest,
  withToken,
} from "../testing/rawRequest.js";

const checkingServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../testing/checkingMediaServer.ts", import.meta.url),
    ),
  ],
  passEnvironment: ["YUMEKIT_TEST_KEY"],
};

const userMediaTools = {
  mcpServers: {
    checking: checkingServer,
    openai: { disabled: true },
    gemini: { disabled: true },
    fal: { disabled: true },
  },
};

function putDefault(options: { engine: TestEngine; body: object }) {
  return rawRequest({
    port: options.engine.port,
    path: "/api/media/defaults",
    method: "PUT",
    headers: withToken({
      token: options.engine.token,
      headers: { "content-type": "application/json" },
    }),
    body: JSON.stringify(options.body),
  });
}

function speechWithNoServer(options: { engine: TestEngine; assetId: string }) {
  return callTool({
    ...options.engine,
    name: "generate_asset",
    input: {
      asset_id: options.assetId,
      capability: "speech",
      input: { text: "one two" },
    },
  });
}

describe("the media choice requests", () => {
  it("lists the services of each kind with their models and the pick that applies now", async () => {
    const { engine } = await startedTestEngine({ userMediaTools });

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/media/choices",
      headers: withToken(engine),
    });

    const speech = {
      capability: "speech",
      current: {
        server: "checking",
        model: null,
        source: "first-ready",
        state: "ready",
      },
      services: [
        { server: "checking", label: "checking", state: "ready", models: [] },
        {
          server: "sample",
          label: "Sample (free test server)",
          state: "ready",
          models: [{ id: "sample-speech", is_default: true }],
        },
      ],
    };
    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toMatchObject({
      choices: [
        { capability: "image" },
        speech,
        { capability: "music" },
        {},
        { capability: "sound-effect" },
        { capability: "sharper" },
      ],
      failed_servers: [],
    });
  });

  it("saves a pick in the user file, and the next call uses it with no restart", async () => {
    const { engine, configurationDirectory } = await startedTestEngine({
      userMediaTools,
    });
    const before = await speechWithNoServer({ engine, assetId: "before" });

    const picked = await putDefault({
      engine,
      body: { capability: "speech", server: "sample" },
    });
    const after = await speechWithNoServer({ engine, assetId: "after" });

    expect(bodyOf(before)).toMatchObject({ isError: true });
    expect(before.body).toContain('The media server \\"checking\\" failed');
    expect(picked.status).toBe(200);
    expect(
      JSON.parse(
        await readFile(
          join(configurationDirectory, "media-tools.json"),
          "utf8",
        ),
      ),
    ).toEqual({ ...userMediaTools, defaults: { speech: "sample" } });
    expect(bodyOf(after)).toMatchObject({ isError: false });
  });

  it("refuses a kind with no row, an unknown server, and a model of another kind", async () => {
    const { engine } = await startedTestEngine({ userMediaTools });

    const answers = await Promise.all([
      putDefault({ engine, body: { capability: "align", server: "sample" } }),
      putDefault({ engine, body: { capability: "image", server: "nobody" } }),
      putDefault({
        engine,
        body: { capability: "image", server: "sample", model: "sample-speech" },
      }),
    ]);

    expect(
      answers.map((answer) => [answer.status, bodyOf(answer)]),
    ).toMatchObject([
      [400, { kind: "body-not-valid" }],
      [404, { kind: "server-not-found" }],
      [400, { kind: "model-not-found" }],
    ]);
  });
});
