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

const userMediaTools = { mcpServers: { openai: { disabled: true } } };

function picture(options: {
  engine: TestEngine;
  assetId: string;
  server: string;
}) {
  return callTool({
    ...options.engine,
    name: "generate_asset",
    input: {
      asset_id: options.assetId,
      capability: "image",
      server: options.server,
      input: {
        prompt: "A red fox on a stone wall, watercolor.",
        width_pixels: 32,
        height_pixels: 18,
      },
    },
  });
}

describe("the media requests of a project", () => {
  it("lists each call the newest first, a failed one with its kind and text, a made one with its file", async () => {
    const { engine } = await startedTestEngine({ userMediaTools });
    await picture({ engine, assetId: "fox", server: "sample" });
    await picture({ engine, assetId: "fox-2", server: "nowhere" });

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/media/requests",
      headers: withToken({ token: engine.token }),
    });

    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toMatchObject({
      requests: [
        {
          asset_id: "fox-2",
          capability: "image",
          prompt_from_you: "A red fox on a stone wall, watercolor.",
          settings: { width_pixels: 32, height_pixels: 18 },
          failure: {
            kind: "server-not-found",
            message: 'No media server is named "nowhere".',
          },
        },
        {
          asset_id: "fox",
          server: "sample",
          prompt_from_you: "A red fox on a stone wall, watercolor.",
          files: [expect.stringMatching(/^assets\/files\/fox\./)],
        },
      ],
    });
  });
});
