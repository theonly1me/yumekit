import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { configurationDirectory } from "./configurationDirectory.js";
import {
  connectFixture,
  sampleServerCommand,
} from "./testing/mediaToolsFixture.js";

const userFile = {
  mcpServers: { sample: sampleServerCommand },
  defaults: { image: "sample" },
  limits: { generatedVideoSeconds: 12 },
};

const projectFile = {
  mcpServers: { sample: sampleServerCommand },
  limits: { callsAtOnce: 2 },
};

const userFilePath = () => join(configurationDirectory(), "media-tools.json");

async function jsonOf(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

describe("connectMediaTools setLimits", () => {
  it("writes a limit for every project to the user file, keeps its other fields, and applies it with no new connection", async () => {
    const { tools, projectFolder } = await connectFixture({ userFile });

    const changed = await tools.setLimits({
      appliesTo: "every-project",
      limits: { spendingUsd: 20 },
    });

    expect(changed).toEqual({
      ok: true,
      value: {
        everyProject: { generatedVideoSeconds: 12, spendingUsd: 20 },
        thisProject: {},
      },
    });
    expect(await tools.limits()).toEqual({
      generatedVideoSeconds: 12,
      spendingUsd: 20,
    });
    expect(await jsonOf(userFilePath())).toEqual({
      ...userFile,
      limits: { generatedVideoSeconds: 12, spendingUsd: 20 },
    });
    expect(await readdir(projectFolder)).not.toContain("media-tools.json");
  });

  it("writes both limits of this project to the project file and keeps its other fields and the user file", async () => {
    const { tools, projectFolder } = await connectFixture({
      userFile,
      projectFile,
    });

    await tools.setLimits({
      appliesTo: "this-project",
      limits: { spendingUsd: 8 },
    });

    expect(await tools.limits()).toEqual({
      generatedVideoSeconds: 12,
      spendingUsd: 8,
    });
    expect(await jsonOf(join(projectFolder, "media-tools.json"))).toEqual({
      ...projectFile,
      limits: { callsAtOnce: 2, generatedVideoSeconds: 12, spendingUsd: 8 },
    });
    expect(await jsonOf(userFilePath())).toEqual(userFile);
    expect(await readdir(projectFolder)).not.toContainEqual(
      expect.stringMatching(/\.tmp$/),
    );
  });

  it("removes the own limits of this project, keeps its other limits, and gives the limits for every project again", async () => {
    const { tools, projectFolder } = await connectFixture({
      userFile,
      projectFile: {
        ...projectFile,
        limits: { callsAtOnce: 2, generatedVideoSeconds: 90, spendingUsd: 30 },
      },
    });

    const removed = await tools.removeOwnLimits();

    expect(removed).toMatchObject({ ok: true, value: { thisProject: {} } });
    expect(await tools.limits()).toEqual({
      generatedVideoSeconds: 12,
      spendingUsd: 5,
    });
    expect(await jsonOf(join(projectFolder, "media-tools.json"))).toEqual(
      projectFile,
    );
  });

  it("follows a change of the user file that another project made", async () => {
    const { tools } = await connectFixture({ userFile });

    await writeFile(
      userFilePath(),
      JSON.stringify({ ...userFile, limits: { spendingUsd: 40 } }),
    );

    expect(await tools.limits()).toMatchObject({ spendingUsd: 40 });
  });

  it("changes nothing and fails when the project file is not valid", async () => {
    const { tools, projectFolder } = await connectFixture({ userFile });
    await writeFile(join(projectFolder, "media-tools.json"), "{ not json");

    const changed = await tools.setLimits({
      appliesTo: "this-project",
      limits: { generatedVideoSeconds: 60 },
    });

    expect(changed.ok ? "written" : changed.failure.kind).toBe(
      "invalid-configuration-file",
    );
    expect(await tools.limits()).toEqual({
      generatedVideoSeconds: 12,
      spendingUsd: 5,
    });
    expect(
      await readFile(join(projectFolder, "media-tools.json"), "utf8"),
    ).toBe("{ not json");
  });
});
