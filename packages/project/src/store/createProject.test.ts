import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, openProject } from "../index.js";
import {
  createTestProject,
  readProjectFile,
  tallOutput,
  temporaryFolder,
  wideOutput,
} from "../testing/projectFixtures.js";

describe("createProject", () => {
  it("gives a snapshot equal to the snapshot that openProject reads back", async () => {
    const store = await createTestProject();
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok && opened.value.read()).toEqual(store.read());
    expect(store.read()).toEqual({
      revision: 0,
      project: {
        formatVersion: 1,
        name: "Test project",
        framesPerSecond: 30,
        outputs: [wideOutput],
      },
      script: "",
      bible: { style: "", palette: [], cast: [], voice: "" },
      scenes: [],
      sceneCode: {},
      sharedCode: {},
      timelines: [{ outputId: "wide", tracks: [] }],
      assets: [],
      takes: [],
    });
  });

  it("writes a .gitignore that keeps renders, the undo history, the cache, and the agent files out of git", async () => {
    const store = await createTestProject();
    expect(await readProjectFile({ store, file: ".gitignore" })).toBe(
      "renders/\n.yumekit/\n.cache/\n.mcp.json\n.codex/config.toml\n.cursor/mcp.json\n",
    );
  });

  it("writes project.json with sorted keys, 2 spaces, and a final newline", async () => {
    const store = await createTestProject();
    expect(await readProjectFile({ store, file: "project.json" })).toBe(
      [
        "{",
        '  "formatVersion": 1,',
        '  "framesPerSecond": 30,',
        '  "name": "Test project",',
        '  "outputs": [',
        "    {",
        '      "heightPixels": 1080,',
        '      "id": "wide",',
        '      "label": "Wide",',
        '      "widthPixels": 1920',
        "    }",
        "  ]",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("refuses a folder that already has files", async () => {
    const folder = await temporaryFolder();
    await writeFile(join(folder, "notes.txt"), "keep me");
    const created = await createProject({
      folder,
      name: "Busy",
      framesPerSecond: 30,
      outputs: [wideOutput],
    });
    expect(created.ok || created.failure.kind).toBe("folder-not-empty");
    expect(await readFile(join(folder, "notes.txt"), "utf8")).toBe("keep me");
  });

  it("refuses an output with an odd width", async () => {
    const created = await createProject({
      folder: await temporaryFolder(),
      name: "Odd",
      framesPerSecond: 30,
      outputs: [{ ...wideOutput, widthPixels: 1921 }],
    });
    expect(created.ok || created.failure.kind).toBe("invalid-value");
  });

  it("refuses two outputs with the same id", async () => {
    const created = await createProject({
      folder: await temporaryFolder(),
      name: "Twice",
      framesPerSecond: 30,
      outputs: [wideOutput, { ...tallOutput, id: "wide" }],
    });
    expect(created.ok || created.failure.kind).toBe("invalid-value");
  });
});
