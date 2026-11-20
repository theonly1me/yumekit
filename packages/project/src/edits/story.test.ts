import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTestProject,
  readProjectFile,
  tallOutput,
  wideOutput,
} from "../testing/projectFixtures.js";

describe("story edits", () => {
  it("setProjectName changes the name in project.json", async () => {
    const store = await createTestProject();
    await store.applyEdits([{ kind: "setProjectName", name: "Renamed" }]);
    expect(store.read().project.name).toBe("Renamed");
    expect(await readProjectFile({ store, file: "project.json" })).toContain(
      '"name": "Renamed"',
    );
  });

  it("addOutput adds the output and an empty timeline file", async () => {
    const store = await createTestProject();
    await store.applyEdits([{ kind: "addOutput", output: tallOutput }]);
    expect(store.read().project.outputs).toEqual([wideOutput, tallOutput]);
    expect(await readProjectFile({ store, file: "timelines/tall.json" })).toBe(
      '{\n  "outputId": "tall",\n  "tracks": []\n}\n',
    );
  });

  it("addOutput refuses an id that is in use", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "addOutput", output: { ...tallOutput, id: "wide" } },
    ]);
    expect(result.ok || result.failure).toMatchObject({
      kind: "id-in-use",
      editIndex: 0,
    });
  });

  it("addOutput refuses an id that does not match the id pattern", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "addOutput", output: { ...tallOutput, id: "Tall Output" } },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it.each([
    { widthPixels: 1081, heightPixels: 1920 },
    { widthPixels: 14, heightPixels: 1920 },
    { widthPixels: 1080, heightPixels: 7682 },
  ])(
    "addOutput refuses the size $widthPixels by $heightPixels",
    async (size) => {
      const store = await createTestProject();
      const result = await store.applyEdits([
        { kind: "addOutput", output: { ...tallOutput, ...size } },
      ]);
      expect(result.ok || result.failure.kind).toBe("invalid-value");
    },
  );

  it("removeOutput removes the output and deletes its timeline file", async () => {
    const store = await createTestProject();
    await store.applyEdits([{ kind: "addOutput", output: tallOutput }]);
    await store.applyEdits([{ kind: "removeOutput", outputId: "tall" }]);
    expect(store.read().project.outputs).toEqual([wideOutput]);
    expect(store.read().timelines.map((timeline) => timeline.outputId)).toEqual(
      ["wide"],
    );
    await expect(
      access(join(store.folder, "timelines/tall.json")),
    ).rejects.toThrow();
  });

  it("removeOutput refuses an output that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "removeOutput", outputId: "square" },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("setScript replaces script.md with the exact text", async () => {
    const store = await createTestProject();
    const script = "# Intro\n\nyumekit turns an idea into a video.\n";
    await store.applyEdits([{ kind: "setScript", script }]);
    expect(store.read().script).toBe(script);
    expect(await readProjectFile({ store, file: "script.md" })).toBe(script);
  });

  it("setBible replaces bible.json", async () => {
    const store = await createTestProject();
    const bible = {
      style: "flat",
      palette: ["#112233"],
      cast: [],
      voice: "calm",
    };
    await store.applyEdits([{ kind: "setBible", bible }]);
    expect(store.read().bible).toEqual(bible);
    expect(
      JSON.parse(await readProjectFile({ store, file: "bible.json" })),
    ).toEqual(bible);
  });

  it("setBible refuses a cast member that references a missing asset", async () => {
    const store = await createTestProject();
    const member = {
      id: "host",
      name: "Host",
      description: "",
      referenceAssetIds: ["host-photo"],
    };
    const result = await store.applyEdits([
      {
        kind: "setBible",
        bible: { style: "", palette: [], cast: [member], voice: "" },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("setBible refuses two cast members with the same id", async () => {
    const store = await createTestProject();
    const member = {
      id: "host",
      name: "Host",
      description: "",
      referenceAssetIds: [],
    };
    const result = await store.applyEdits([
      {
        kind: "setBible",
        bible: { style: "", palette: [], cast: [member, member], voice: "" },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("id-in-use");
  });
});
