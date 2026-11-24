import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

const userMediaTools = {
  mcpServers: { openai: { disabled: true } },
  limits: { generatedVideoSeconds: 30 },
};

function putLimit(options: {
  engine: TestEngine;
  body: object;
  byAgent?: boolean;
}) {
  return rawRequest({
    port: options.engine.port,
    path: "/api/media/limits",
    method: "PUT",
    headers: withToken({
      token: options.engine.token,
      headers: {
        "content-type": "application/json",
        ...(options.byAgent === true ? { "x-yumekit-client": "agent" } : {}),
      },
    }),
    body: JSON.stringify(options.body),
  });
}

function videoOfSeconds(options: { engine: TestEngine; seconds: number }) {
  return callTool({
    ...options.engine,
    name: "generate_asset",
    input: {
      asset_id: `clip-${String(options.seconds)}`,
      capability: "video",
      server: "sample",
      input: { prompt: "a fox", duration_seconds: options.seconds },
    },
  });
}

describe("the media limit request", () => {
  it("saves the limit of real video in the user file, and the next video call uses it with no restart", async () => {
    const { engine, configurationDirectory } = await startedTestEngine({
      userMediaTools,
    });

    const answer = await putLimit({
      engine,
      body: { generated_video_seconds: 1 },
    });
    const tooLong = await videoOfSeconds({ engine, seconds: 2 });

    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toEqual({
      generated_video_seconds: 1,
      spending_usd: 5,
    });
    expect(
      JSON.parse(
        await readFile(
          join(configurationDirectory, "media-tools.json"),
          "utf8",
        ),
      ),
    ).toEqual({ ...userMediaTools, limits: { generatedVideoSeconds: 1 } });
    expect(bodyOf(tooLong)).toMatchObject({
      isError: true,
      data: { kind: "generated-video-limit-reached", limit_seconds: 1 },
    });
  });

  it("rejects a limit that is not a whole number of seconds from 0 to 3600", async () => {
    const { engine } = await startedTestEngine({ userMediaTools });

    const answers = await Promise.all(
      [-1, 2.5, 3601].map((seconds) =>
        putLimit({ engine, body: { generated_video_seconds: seconds } }),
      ),
    );

    expect(answers.map((answer) => answer.status)).toEqual([400, 400, 400]);
  });

  it("saves a spending limit in US dollars and keeps the video limit", async () => {
    const { engine, configurationDirectory } = await startedTestEngine({
      userMediaTools,
    });

    const answer = await putLimit({ engine, body: { spending_usd: 2.5 } });

    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toEqual({
      generated_video_seconds: 30,
      spending_usd: 2.5,
    });
    expect(
      JSON.parse(
        await readFile(
          join(configurationDirectory, "media-tools.json"),
          "utf8",
        ),
      ),
    ).toEqual({
      ...userMediaTools,
      limits: { generatedVideoSeconds: 30, spendingUsd: 2.5 },
    });
  });

  it("refuses a limit change by the AI and changes no file", async () => {
    const { engine, configurationDirectory } = await startedTestEngine({
      userMediaTools,
    });

    const answer = await putLimit({
      engine,
      body: { spending_usd: 1000 },
      byAgent: true,
    });

    expect(answer.status).toBe(403);
    expect(bodyOf(answer)).toMatchObject({ kind: "limit-not-for-the-ai" });
    expect(
      JSON.parse(
        await readFile(
          join(configurationDirectory, "media-tools.json"),
          "utf8",
        ),
      ),
    ).toEqual(userMediaTools);
  });

  it("rejects a body with no limit", async () => {
    const { engine } = await startedTestEngine({ userMediaTools });

    const answer = await putLimit({ engine, body: {} });

    expect(answer.status).toBe(400);
  });
});
