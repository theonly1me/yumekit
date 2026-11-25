import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { configurationDirectory } from "./configurationDirectory.js";
import { connectMediaTools } from "./connectMediaTools.js";
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

async function projectFileOf(projectFolder: string): Promise<unknown> {
  return JSON.parse(
    await readFile(join(projectFolder, "media-tools.json"), "utf8"),
  );
}

describe("connectMediaTools setLimits", () => {
  it("writes the limit to the project file, keeps its other fields and the user file, and applies it with no new connection", async () => {
    const { tools, projectFolder } = await connectFixture({
      userFile,
      projectFile,
    });

    const changed = await tools.setLimits({ generatedVideoSeconds: 45 });

    expect(changed).toEqual({
      ok: true,
      value: { generatedVideoSeconds: 45, spendingUsd: 5 },
    });
    expect(tools.limits()).toEqual({
      generatedVideoSeconds: 45,
      spendingUsd: 5,
    });
    expect(await projectFileOf(projectFolder)).toEqual({
      ...projectFile,
      limits: { callsAtOnce: 2, generatedVideoSeconds: 45 },
    });
    expect(JSON.parse(await readFile(userFilePath(), "utf8"))).toEqual(
      userFile,
    );
    expect(await readdir(projectFolder)).not.toContainEqual(
      expect.stringMatching(/\.tmp$/),
    );
  });

  it("keeps the limit of the project when the configuration folder changes", async () => {
    const { tools, projectFolder } = await connectFixture({ userFile });
    await tools.setLimits({ spendingUsd: 1.5, generatedVideoSeconds: 8 });
    const otherFolder = join(projectFolder, "..", "other-config");
    await mkdir(otherFolder);
    vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", otherFolder);

    const again = await connectMediaTools({
      projectFolder,
      bundledServers: { sample: sampleServerCommand },
    });
    if (!again.ok) throw new Error(again.failure.message);
    const limits = again.value.limits();
    await again.value.close();

    expect(limits).toEqual({ generatedVideoSeconds: 8, spendingUsd: 1.5 });
  });

  it("changes nothing and fails when the project file is not valid", async () => {
    const { tools, projectFolder } = await connectFixture({ userFile });
    await writeFile(join(projectFolder, "media-tools.json"), "{ not json");

    const changed = await tools.setLimits({ generatedVideoSeconds: 60 });

    expect(changed.ok ? "written" : changed.failure.kind).toBe(
      "invalid-configuration-file",
    );
    expect(tools.limits()).toEqual({
      generatedVideoSeconds: 12,
      spendingUsd: 5,
    });
    expect(
      await readFile(join(projectFolder, "media-tools.json"), "utf8"),
    ).toBe("{ not json");
  });
});
