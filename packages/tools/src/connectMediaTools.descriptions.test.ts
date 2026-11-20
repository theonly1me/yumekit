import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  sampleServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";

const openAiServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../../../tools/openai-media/src/main.ts", import.meta.url),
    ),
  ],
  passEnvironment: ["OPENAI_API_KEY"],
};

describe("connectMediaTools descriptions", () => {
  it("reads a valid description of the sample server and of openai-media with no key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { tools } = await connectFixture({
      projectFile: {
        mcpServers: {
          sample: sampleServerCommand,
          openai: openAiServerCommand,
        },
      },
    });

    const [sample, openai] = tools.list();

    expect(sample?.descriptionFailure).toBeUndefined();
    expect(sample?.description).toMatchObject({ runs: "on-this-computer" });
    expect(openai?.descriptionFailure).toBeUndefined();
    expect(openai?.description).toMatchObject({
      label: "OpenAI",
      runs: "hosted",
      keys: [{ variable: "OPENAI_API_KEY" }],
    });
  });

  it("keeps a server with a description that does not match the schema usable", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          broken: {
            ...keyedServerCommand,
            args: [...keyedServerCommand.args, "--invalid-description"],
          },
        },
      },
      beforeConnect: () =>
        saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue }),
    });

    const [entry] = tools.list();
    const outcome = await tools.run({
      capability: "image",
      input: { prompt: "a fox" },
      outputDirectory,
      fileStem: "fox",
    });

    expect(entry?.description).toBeUndefined();
    expect(entry?.descriptionFailure?.kind).toBe("media-tool-invalid-result");
    expect(entry?.capabilities).toEqual(["image", "speech", "music"]);
    expect(outcome.ok).toBe(true);
  });

  it("calls check_key of a server, and names a server that has no check_key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { tools } = await connectFixture({
      projectFile: {
        mcpServers: {
          sample: sampleServerCommand,
          openai: openAiServerCommand,
        },
      },
    });

    const openai = await tools.checkKey("openai");
    const sample = await tools.checkKey("sample");
    const unknown = await tools.checkKey("nobody");

    expect(openai).toEqual({
      ok: true,
      value: { valid: false, message: "OPENAI_API_KEY is not set." },
    });
    expect(sample).toEqual({
      ok: false,
      failure: { kind: "no-check-key-tool", server: "sample" },
    });
    expect(unknown).toEqual({
      ok: false,
      failure: { kind: "server-not-found", server: "nobody" },
    });
  });
});
