import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import { bodyOf, rawRequest, withToken } from "../testing/rawRequest.js";

const checkingServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../testing/checkingMediaServer.ts", import.meta.url),
    ),
  ],
  passEnvironment: ["YUMEKIT_TEST_KEY"],
};

describe("the media servers request", () => {
  it("says for each server if it has the check_key tool", async () => {
    const { engine } = await startedTestEngine({
      userMediaTools: {
        mcpServers: {
          checking: checkingServer,
          gemini: { disabled: true },
          fal: { disabled: true },
          "local-voice": { disabled: true },
          openai: { disabled: true },
        },
      },
    });

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/media-servers",
      headers: withToken(engine),
    });

    expect(bodyOf(answer)).toMatchObject({
      servers: [
        { server: "checking", can_check_key: true },
        { server: "sample", can_check_key: false },
      ],
    });
  });
});
