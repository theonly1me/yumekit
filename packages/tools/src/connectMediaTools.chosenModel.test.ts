import { describe, expect, it } from "vitest";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  sampleServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";

const saveTestKey = () =>
  saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue });

describe("connectMediaTools chosenModel", () => {
  it("gives the described model that a call with that model would use", async () => {
    const { tools } = await connectFixture({
      projectFile: { mcpServers: { keyed: keyedServerCommand } },
      beforeConnect: saveTestKey,
    });

    const chosen = await tools.chosenModel({
      capability: "image",
      model: "keyed-image-large",
    });

    expect(chosen?.id).toBe("keyed-image-large");
    expect(chosen?.settings.map((setting) => setting.name)).toEqual([
      "reference_image_paths",
    ]);
  });

  it("gives the model of the configured default when the call names none", async () => {
    const { tools } = await connectFixture({
      projectFile: {
        mcpServers: { sample: sampleServerCommand, keyed: keyedServerCommand },
        defaults: { image: { server: "keyed", model: "keyed-image-large" } },
      },
      beforeConnect: saveTestKey,
    });

    expect((await tools.chosenModel({ capability: "image" }))?.id).toBe(
      "keyed-image-large",
    );
  });

  it("gives the described default model of the server", async () => {
    const { tools } = await connectFixture({
      projectFile: { mcpServers: { keyed: keyedServerCommand } },
      beforeConnect: saveTestKey,
    });

    expect((await tools.chosenModel({ capability: "image" }))?.id).toBe(
      "keyed-image",
    );
  });

  it("gives nothing for a server that does not exist", async () => {
    const { tools } = await connectFixture({});

    expect(
      await tools.chosenModel({ capability: "image", server: "missing" }),
    ).toBeUndefined();
  });
});
