import { describe, expect, it } from "vitest";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  sampleServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";
import type { MediaTools } from "./types.js";

async function modelSentForSpeech(options: {
  tools: MediaTools;
  outputDirectory: string;
  server?: string;
  model?: string;
}): Promise<unknown> {
  const outcome = await options.tools.run({
    capability: "speech",
    ...(options.server === undefined ? {} : { server: options.server }),
    ...(options.model === undefined ? {} : { model: options.model }),
    input: { text: "report" },
    outputDirectory: options.outputDirectory,
    fileStem: "report",
  });
  if (outcome.ok || outcome.failure.kind !== "media-tool-failed") {
    throw new Error("Expected the report as a failure message");
  }
  const report: unknown = JSON.parse(outcome.failure.message);
  return typeof report === "object" && report !== null
    ? Reflect.get(report, "model")
    : undefined;
}

const saveTestKey = () =>
  saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue });

describe("connectMediaTools models and defaults", () => {
  it("passes the model of the request to the tool and reports it", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { keyed: keyedServerCommand } },
      beforeConnect: saveTestKey,
    });

    const sent = await modelSentForSpeech({
      tools,
      outputDirectory,
      model: "keyed-speech",
    });
    const image = await tools.run({
      capability: "image",
      model: "keyed-image-large",
      input: { prompt: "a fox" },
      outputDirectory,
      fileStem: "fox",
    });

    expect(sent).toBe("keyed-speech");
    expect(image.ok && image.value.model).toBe("keyed-image-large");
  });

  it("reports the described default model when the request gives none", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { keyed: keyedServerCommand } },
      beforeConnect: saveTestKey,
    });

    const image = await tools.run({
      capability: "image",
      input: { prompt: "a fox" },
      outputDirectory,
      fileStem: "fox",
    });

    expect(image.ok && image.value).toMatchObject({
      server: "keyed",
      model: "keyed-image",
      result: { cost_usd: 0.5, cost_is_estimate: true },
    });
  });

  it("uses a default given as a server name", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { sample: sampleServerCommand, keyed: keyedServerCommand },
        defaults: { speech: "keyed" },
      },
      beforeConnect: saveTestKey,
    });

    expect(await modelSentForSpeech({ tools, outputDirectory })).toBeNull();
  });

  it("uses a default given as a server and a model, and passes the model", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { sample: sampleServerCommand, keyed: keyedServerCommand },
        defaults: { speech: { server: "keyed", model: "keyed-speech" } },
      },
      beforeConnect: saveTestKey,
    });

    expect(await modelSentForSpeech({ tools, outputDirectory })).toBe(
      "keyed-speech",
    );
  });

  it("returns the server failure that lists the model ids for an unknown model", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "image",
      model: "no-such-model",
      input: { prompt: "a fox" },
      outputDirectory,
      fileStem: "fox",
    });

    expect(outcome).toEqual({
      ok: false,
      failure: {
        kind: "media-tool-failed",
        server: "sample",
        message:
          'Unknown model "no-such-model". The image models of this server are: sample-image.',
      },
    });
  });
});
