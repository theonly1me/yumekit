import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { configurationDirectory } from "./configurationDirectory.js";
import {
  connectFixture,
  sampleServerCommand,
} from "./testing/mediaToolsFixture.js";
import { readUserLimits } from "./userLimits.js";

const userFile = {
  mcpServers: { sample: sampleServerCommand },
  defaults: { image: "sample" },
  limits: { generatedVideoSeconds: 12 },
};

const userFilePath = () => join(configurationDirectory(), "media-tools.json");

describe("connectMediaTools setLimits", () => {
  it("writes the limit to the user file, keeps each other field, and applies it with no new connection", async () => {
    const { tools } = await connectFixture({ userFile });

    const changed = await tools.setLimits({ generatedVideoSeconds: 45 });

    expect(changed).toEqual({
      ok: true,
      value: { generatedVideoSeconds: 45, spendingUsd: 5 },
    });
    expect(tools.limits()).toEqual({
      generatedVideoSeconds: 45,
      spendingUsd: 5,
    });
    expect(JSON.parse(await readFile(userFilePath(), "utf8"))).toEqual({
      ...userFile,
      limits: { generatedVideoSeconds: 45 },
    });
    expect(await readUserLimits()).toEqual({
      ok: true,
      value: { generatedVideoSeconds: 45, spendingUsd: 5 },
    });
    expect(await readdir(configurationDirectory())).not.toContainEqual(
      expect.stringMatching(/\.tmp$/),
    );
  });

  it("keeps the limit of a project file, which wins over the user file", async () => {
    const { tools } = await connectFixture({
      userFile,
      projectFile: { limits: { generatedVideoSeconds: 5 } },
    });

    const changed = await tools.setLimits({ generatedVideoSeconds: 60 });

    expect(changed).toEqual({
      ok: true,
      value: { generatedVideoSeconds: 5, spendingUsd: 5 },
    });
  });

  it("changes nothing and fails when the user file is not valid", async () => {
    const { tools } = await connectFixture({ userFile });
    await writeFile(userFilePath(), "{ not json");

    const changed = await tools.setLimits({ generatedVideoSeconds: 60 });

    expect(changed.ok ? "written" : changed.failure.kind).toBe(
      "invalid-configuration-file",
    );
    expect(tools.limits()).toEqual({
      generatedVideoSeconds: 12,
      spendingUsd: 5,
    });
    expect(await readFile(userFilePath(), "utf8")).toBe("{ not json");
  });

  it("writes a spending limit in US dollars next to the video limit", async () => {
    const { tools } = await connectFixture({ userFile });

    const changed = await tools.setLimits({ spendingUsd: 1.5 });

    expect(changed).toEqual({
      ok: true,
      value: { generatedVideoSeconds: 12, spendingUsd: 1.5 },
    });
    expect(JSON.parse(await readFile(userFilePath(), "utf8"))).toEqual({
      ...userFile,
      limits: { generatedVideoSeconds: 12, spendingUsd: 1.5 },
    });
  });
});
