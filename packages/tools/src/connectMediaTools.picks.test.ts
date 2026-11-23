import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { configurationDirectory } from "./configurationDirectory.js";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  sampleServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";
import type { MediaTools } from "./types.js";

const userFile = {
  mcpServers: { sample: sampleServerCommand, keyed: keyedServerCommand },
  limits: { generatedVideoSeconds: 12 },
};

const userFilePath = () => join(configurationDirectory(), "media-tools.json");

async function pictureServer(options: {
  tools: MediaTools;
  outputDirectory: string;
}) {
  const outcome = await options.tools.run({
    capability: "image",
    input: { prompt: "a fox" },
    outputDirectory: options.outputDirectory,
    fileStem: "fox",
  });
  return outcome.ok ? outcome.value : outcome.failure;
}

const withKey = () =>
  connectFixture({
    userFile,
    beforeConnect: () =>
      saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue }),
  });

describe("connectMediaTools picks", () => {
  it("writes a pick to defaults of the user file, keeps each other field, and uses it at the next call", async () => {
    const { tools, outputDirectory } = await withKey();
    expect(await pictureServer({ tools, outputDirectory })).toMatchObject({
      server: "keyed",
    });

    const picked = await tools.pick({
      capability: "image",
      server: "sample",
      model: "sample-image",
    });

    expect(picked.ok).toBe(true);
    expect(JSON.parse(await readFile(userFilePath(), "utf8"))).toEqual({
      ...userFile,
      defaults: { image: { server: "sample", model: "sample-image" } },
    });
    expect(await pictureServer({ tools, outputDirectory })).toMatchObject({
      server: "sample",
      model: "sample-image",
    });
  });

  it("removes a pick, so the next call uses the first ready server again", async () => {
    const { tools, outputDirectory } = await withKey();
    await tools.pick({ capability: "image", server: "sample" });

    await tools.pick({ capability: "image" });

    expect(await pictureServer({ tools, outputDirectory })).toMatchObject({
      server: "keyed",
    });
  });

  it("refuses a model that the server does not describe and leaves the file as it was", async () => {
    const { tools } = await withKey();
    const before = await readFile(userFilePath(), "utf8");

    const picked = await tools.pick({
      capability: "image",
      server: "keyed",
      model: "keyed-speech",
    });

    expect(picked.ok ? "saved" : picked.failure).toMatchObject({
      kind: "model-not-found",
      server: "keyed",
      model: "keyed-speech",
    });
    expect(await readFile(userFilePath(), "utf8")).toBe(before);
  });

  it("does not write over a user file that is not valid", async () => {
    const { tools } = await withKey();
    await writeFile(userFilePath(), "{ not json");

    const picked = await tools.pick({ capability: "image", server: "sample" });

    expect(picked.ok ? "saved" : picked.failure.kind).toBe(
      "invalid-configuration-file",
    );
    expect(await readFile(userFilePath(), "utf8")).toBe("{ not json");
  });

  it("lists each model of each service for a kind, with the state and the pick that applies now", async () => {
    const { tools } = await connectFixture({ userFile });

    const { choices } = await tools.choices();
    const pictures = choices.find((choice) => choice.capability === "image");

    expect(choices.map((choice) => choice.capability)).toEqual([
      "image",
      "speech",
      "music",
      "video",
      "sound-effect",
      "talking-clip",
      "sharper",
    ]);
    expect(pictures?.services).toMatchObject([
      {
        server: "keyed",
        label: "Keyed test server",
        state: "needs-key",
        models: [{ id: "keyed-image" }, { id: "keyed-image-large" }],
      },
      { server: "sample", state: "ready", models: [{ id: "sample-image" }] },
    ]);
    expect(pictures?.current).toEqual({
      server: "sample",
      serverLabel: "Sample (free test server)",
      model: "sample-image",
      modelLabel: "Prompt as text on a plain color",
      source: "first-ready",
      state: "ready",
    });
  });

  it("gives the source picked for a pick of a service that still needs a key", async () => {
    const { tools } = await connectFixture({ userFile });

    const picked = await tools.pick({
      capability: "image",
      server: "keyed",
      model: "keyed-image-large",
    });

    const pictures = picked.ok
      ? picked.value.choices.find((choice) => choice.capability === "image")
      : undefined;
    expect(pictures?.current).toMatchObject({
      server: "keyed",
      model: "keyed-image-large",
      source: "picked",
      state: "needs-key",
    });
  });
});
