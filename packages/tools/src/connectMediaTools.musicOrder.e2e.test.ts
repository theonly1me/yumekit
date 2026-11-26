import { describe, expect, it } from "vitest";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  sampleServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";
import type { MediaTools } from "./types.js";

function musicCall(options: { tools: MediaTools; outputDirectory: string }) {
  return options.tools.run({
    capability: "music",
    input: { prompt: "a calm bed", duration_seconds: 2 },
    outputDirectory: options.outputDirectory,
    fileStem: "bed",
  });
}

describe("connectMediaTools order with no pick for music", () => {
  it("asks gemini before local-music when its key is there", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          "local-music": sampleServerCommand,
          gemini: keyedServerCommand,
        },
      },
      beforeConnect: () =>
        saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue }),
    });

    const outcome = await musicCall({ tools, outputDirectory });

    expect(outcome.ok ? outcome.value.server : outcome.failure).toMatchObject({
      kind: "media-tool-failed",
      server: "gemini",
      message: "The keyed test server makes no music.",
    });
  });

  it("puts each other server of the file before local-music", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          "local-music": sampleServerCommand,
          custom: sampleServerCommand,
        },
      },
    });

    const outcome = await musicCall({ tools, outputDirectory });

    expect(outcome.ok && outcome.value.server).toBe("custom");
  });
});
