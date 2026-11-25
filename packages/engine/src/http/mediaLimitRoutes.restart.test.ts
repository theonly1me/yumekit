import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createTestProject,
  startTestEngine,
  startedTestEngine,
  type TestEngine,
} from "../testing/engineFixture.js";
import { bodyOf, rawRequest, withToken } from "../testing/rawRequest.js";

const userMediaTools = {
  mcpServers: { openai: { disabled: true } },
  limits: { generatedVideoSeconds: 30 },
};

function putLimits(options: {
  engine: TestEngine;
  appliesTo: "every-project" | "this-project";
}) {
  return rawRequest({
    port: options.engine.port,
    path: "/api/media/limits",
    method: "PUT",
    headers: withToken({
      token: options.engine.token,
      headers: { "content-type": "application/json" },
    }),
    body: JSON.stringify({
      applies_to: options.appliesTo,
      generated_video_seconds: 7,
      spending_usd: 1.25,
    }),
  });
}

async function limitsOf(engine: TestEngine): Promise<unknown> {
  const answer = await rawRequest({
    port: engine.port,
    path: "/api/media-servers",
    headers: withToken({ token: engine.token }),
  });
  return bodyOf(answer);
}

describe("limits that the person sets in Settings", () => {
  it("for every project apply to another project that has no limits of its own", async () => {
    const { engine, configurationDirectory } = await startedTestEngine({
      userMediaTools,
    });
    await putLimits({ engine, appliesTo: "every-project" });
    const other = await createTestProject();
    vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", configurationDirectory);

    const otherEngine = await startTestEngine({
      projectFolder: other.projectFolder,
    });

    expect(await limitsOf(otherEngine)).toMatchObject({
      generated_video: { limit_seconds: 7 },
      spending: { limit_usd: 1.25 },
    });
  });

  it("for every project do not change a project with its own limits, and the limits say so", async () => {
    const { engine, projectFolder } = await startedTestEngine({
      userMediaTools,
    });
    await writeFile(
      join(projectFolder, "media-tools.json"),
      JSON.stringify({
        limits: { spendingUsd: 12, generatedVideoSeconds: 90 },
      }),
    );

    await putLimits({ engine, appliesTo: "every-project" });
    const read = await rawRequest({
      port: engine.port,
      path: "/api/media/limits",
      headers: withToken({ token: engine.token }),
    });

    expect(bodyOf(read)).toEqual({
      generated_video_seconds: 90,
      spending_usd: 12,
      every_project: { generated_video_seconds: 7, spending_usd: 1.25 },
      this_project: { generated_video_seconds: 90, spending_usd: 12 },
    });
    expect(await limitsOf(engine)).toMatchObject({
      generated_video: { limit_seconds: 90 },
      spending: { limit_usd: 12 },
    });
  });

  it("for this project stay with the project when another configuration folder is in use", async () => {
    const { engine, root, projectFolder } = await startedTestEngine({
      userMediaTools,
    });
    await putLimits({ engine, appliesTo: "this-project" });
    await engine.close();
    const otherFolder = join(root, "other-config");
    await mkdir(otherFolder);
    vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", otherFolder);

    const again = await startTestEngine({ projectFolder });

    expect(await limitsOf(again)).toMatchObject({
      generated_video: { limit_seconds: 7 },
      spending: { limit_usd: 1.25 },
    });
  });
});
