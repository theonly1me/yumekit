import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  startTestEngine,
  startedTestEngine,
  type TestEngine,
} from "../testing/engineFixture.js";
import { bodyOf, rawRequest, withToken } from "../testing/rawRequest.js";

const userMediaTools = { mcpServers: { openai: { disabled: true } } };

function putLimits(engine: TestEngine) {
  return rawRequest({
    port: engine.port,
    path: "/api/media/limits",
    method: "PUT",
    headers: withToken({
      token: engine.token,
      headers: { "content-type": "application/json" },
    }),
    body: JSON.stringify({ generated_video_seconds: 7, spending_usd: 1.25 }),
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
  it("belong to the project, so another configuration folder keeps them", async () => {
    const { engine, root, projectFolder } = await startedTestEngine({
      userMediaTools,
    });
    await putLimits(engine);
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
