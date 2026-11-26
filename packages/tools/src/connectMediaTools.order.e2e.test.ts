import { describe, expect, it } from "vitest";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  sampleServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";
import type { MediaTools } from "./types.js";

const saveTestKey = () =>
  saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue });

function pictureCall(options: { tools: MediaTools; outputDirectory: string }) {
  return options.tools.run({
    capability: "image",
    input: { prompt: "a fox" },
    outputDirectory: options.outputDirectory,
    fileStem: "fox",
  });
}

describe("connectMediaTools order with no pick", () => {
  it("uses openai for a picture with no pick when its key is there", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { sample: sampleServerCommand, openai: keyedServerCommand },
      },
      beforeConnect: saveTestKey,
    });

    const outcome = await pictureCall({ tools, outputDirectory });

    expect(outcome.ok && outcome.value.server).toBe("openai");
  });

  it("uses sample for a picture with no pick when the openai key is missing", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { sample: sampleServerCommand, openai: keyedServerCommand },
      },
    });

    const outcome = await pictureCall({ tools, outputDirectory });

    expect(outcome.ok && outcome.value.server).toBe("sample");
  });

  it("puts openai, gemini, and fal before each other server of the file", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          sample: sampleServerCommand,
          custom: keyedServerCommand,
          fal: keyedServerCommand,
          gemini: keyedServerCommand,
        },
      },
      beforeConnect: saveTestKey,
    });

    const outcome = await pictureCall({ tools, outputDirectory });

    expect(outcome.ok && outcome.value.server).toBe("gemini");
  });

  it("returns media-key-missing for the first server in the order when no server is ready", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          custom: keyedServerCommand,
          fal: keyedServerCommand,
          sample: { disabled: true },
        },
      },
    });

    const outcome = await pictureCall({ tools, outputDirectory });

    expect(outcome.ok ? "a file" : outcome.failure).toMatchObject({
      kind: "media-key-missing",
      server: "fal",
      variable: "YUMEKIT_TEST_KEY",
    });
  });

  it("uses local-voice for a voice with no pick and no key, before sample", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          sample: sampleServerCommand,
          "local-voice": sampleServerCommand,
          openai: keyedServerCommand,
        },
      },
    });

    const outcome = await tools.run({
      capability: "speech",
      input: { text: "Hello there" },
      outputDirectory,
      fileStem: "hello",
    });

    expect(outcome.ok && outcome.value.server).toBe("local-voice");
  });

  it("puts each other server of the file before local-voice", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          "local-voice": sampleServerCommand,
          custom: sampleServerCommand,
        },
      },
    });

    const outcome = await pictureCall({ tools, outputDirectory });

    expect(outcome.ok && outcome.value.server).toBe("custom");
  });
});
