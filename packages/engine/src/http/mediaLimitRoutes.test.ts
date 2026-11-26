import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
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

const kindSchema = z.object({ kind: z.string() });

const userMediaTools = {
  mcpServers: { openai: { disabled: true } },
  limits: { generatedVideoSeconds: 30 },
};

function limitRequest(options: {
  engine: TestEngine;
  method: "GET" | "PUT" | "DELETE";
  path?: string;
  body?: object;
  byAgent?: boolean;
}) {
  return rawRequest({
    port: options.engine.port,
    path: options.path ?? "/api/media/limits",
    method: options.method,
    headers: withToken({
      token: options.engine.token,
      headers: {
        "content-type": "application/json",
        ...(options.byAgent === true ? { "x-yumekit-client": "agent" } : {}),
      },
    }),
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
}

async function fileOf(folder: string): Promise<unknown> {
  return JSON.parse(await readFile(join(folder, "media-tools.json"), "utf8"));
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

describe("the media limit requests", () => {
  it("save a limit for every project in the user file, and the next video call of a project with no own limits uses it with no restart", async () => {
    const { engine, configurationDirectory, projectFolder } =
      await startedTestEngine({ userMediaTools });

    const answer = await limitRequest({
      engine,
      method: "PUT",
      body: { applies_to: "every-project", generated_video_seconds: 1 },
    });
    const tooLong = await videoOfSeconds({ engine, seconds: 2 });

    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toEqual({
      generated_video_seconds: 1,
      spending_usd: 5,
      every_project: { generated_video_seconds: 1, spending_usd: 5 },
      this_project: null,
    });
    expect(await fileOf(configurationDirectory)).toEqual({
      ...userMediaTools,
      limits: { generatedVideoSeconds: 1 },
    });
    expect(await readdir(projectFolder)).not.toContain("media-tools.json");
    expect(bodyOf(tooLong)).toMatchObject({
      isError: true,
      data: { kind: "generated-video-limit-reached", limit_seconds: 1 },
    });
  });

  it("save other limits for this project in the project file, and remove them again", async () => {
    const { engine, projectFolder } = await startedTestEngine({
      userMediaTools,
    });

    const own = await limitRequest({
      engine,
      method: "PUT",
      body: { applies_to: "this-project", spending_usd: 2.5 },
    });
    const ownFile = await fileOf(projectFolder);
    const removed = await limitRequest({
      engine,
      method: "DELETE",
      path: "/api/media/limits/this-project",
    });

    expect(bodyOf(own)).toMatchObject({
      spending_usd: 2.5,
      this_project: { generated_video_seconds: 30, spending_usd: 2.5 },
    });
    expect(ownFile).toEqual({
      limits: { generatedVideoSeconds: 30, spendingUsd: 2.5 },
    });
    expect(bodyOf(removed)).toMatchObject({
      spending_usd: 5,
      this_project: null,
    });
    expect(await fileOf(projectFolder)).toEqual({});
  });

  it("reject a limit that is not a whole number of seconds from 0 to 3600, and a body with no limit or no scope", async () => {
    const { engine } = await startedTestEngine({ userMediaTools });

    const answers = await Promise.all(
      [
        ...[-1, 2.5, 3601].map((seconds) => ({
          applies_to: "every-project",
          generated_video_seconds: seconds,
        })),
        { applies_to: "every-project" },
        { spending_usd: 3 },
      ].map((body) => limitRequest({ engine, method: "PUT", body })),
    );

    expect(answers.map((answer) => answer.status)).toEqual([
      400, 400, 400, 400, 400,
    ]);
  });

  it("refuse each limit change by the AI and change no file", async () => {
    const { engine, configurationDirectory, projectFolder } =
      await startedTestEngine({ userMediaTools });

    const answers = await Promise.all(
      [
        {
          method: "PUT",
          body: { applies_to: "every-project", spending_usd: 9 },
        },
        {
          method: "PUT",
          body: { applies_to: "this-project", spending_usd: 9 },
        },
        { method: "DELETE", path: "/api/media/limits/this-project" },
      ].map((request) =>
        limitRequest({
          engine,
          ...request,
          method: request.method === "PUT" ? "PUT" : "DELETE",
          byAgent: true,
        }),
      ),
    );

    expect(
      answers.map(
        (answer) =>
          `${String(answer.status)} ${kindSchema.parse(bodyOf(answer)).kind}`,
      ),
    ).toEqual(Array.from({ length: 3 }, () => "403 limit-not-for-the-ai"));
    expect(await fileOf(configurationDirectory)).toEqual(userMediaTools);
    expect(await readdir(projectFolder)).not.toContain("media-tools.json");
  });
});
