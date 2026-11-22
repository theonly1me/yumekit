import { describe, expect, it } from "vitest";
import {
  findPlatform,
  openProject,
  platformCatalog,
  platformsOfSize,
} from "../index.js";
import {
  createTestProject,
  readProjectFile,
  tallOutput,
} from "../testing/projectFixtures.js";

describe("the platform catalog", () => {
  it("has the eight platforms of document 13 in their order", () => {
    expect(
      platformCatalog.map((platform) => [
        platform.id,
        platform.widthPixels,
        platform.heightPixels,
        platform.outputId,
      ]),
    ).toEqual([
      ["youtube", 1920, 1080, "wide"],
      ["youtube-shorts", 1080, 1920, "tall"],
      ["tiktok", 1080, 1920, "tall"],
      ["instagram-reel", 1080, 1920, "tall"],
      ["instagram-post", 1080, 1350, "portrait"],
      ["x", 1920, 1080, "wide"],
      ["linkedin", 1920, 1080, "wide"],
      ["square", 1080, 1080, "square"],
    ]);
  });

  it("finds a platform by id and gives nothing for an unknown id", () => {
    expect(findPlatform("tiktok")?.name).toBe("TikTok");
    expect(findPlatform("myspace")).toBeUndefined();
  });

  it("lists the platforms of one size", () => {
    expect(
      platformsOfSize({ widthPixels: 1080, heightPixels: 1920 }).map(
        (platform) => platform.id,
      ),
    ).toEqual(["youtube-shorts", "tiktok", "instagram-reel"]);
    expect(platformsOfSize({ widthPixels: 640, heightPixels: 480 })).toEqual(
      [],
    );
  });
});

describe("the platforms of an output", () => {
  it("setOutputPlatforms writes the ids in catalog order", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      { kind: "setOutputPlatforms", outputId: "wide", platforms: ["x"] },
      {
        kind: "setOutputPlatforms",
        outputId: "wide",
        platforms: ["linkedin", "youtube"],
      },
    ]);

    expect(store.read().project.outputs[0]?.platforms).toEqual([
      "youtube",
      "linkedin",
    ]);
    expect(await readProjectFile({ store, file: "project.json" })).toContain(
      '"platforms": [\n        "youtube",\n        "linkedin"\n      ]',
    );
  });

  it("setOutputPlatforms with no id removes the field", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      { kind: "setOutputPlatforms", outputId: "wide", platforms: ["x"] },
    ]);
    await store.applyEdits([
      { kind: "setOutputPlatforms", outputId: "wide", platforms: [] },
    ]);

    expect(
      await readProjectFile({ store, file: "project.json" }),
    ).not.toContain("platforms");
  });

  it("refuses a platform of another size", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "setOutputPlatforms", outputId: "wide", platforms: ["tiktok"] },
    ]);

    expect(result.ok || result.failure).toMatchObject({
      kind: "invalid-value",
      editIndex: 0,
    });
  });

  it("refuses one platform on two outputs", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "addOutput", output: { ...tallOutput, platforms: ["tiktok"] } },
      {
        kind: "addOutput",
        output: { ...tallOutput, id: "tall-2", platforms: ["tiktok"] },
      },
    ]);

    expect(result.ok || result.failure).toMatchObject({
      kind: "id-in-use",
      editIndex: 1,
    });
  });

  it("opens a project with platforms again", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      { kind: "setOutputPlatforms", outputId: "wide", platforms: ["youtube"] },
    ]);

    const opened = await openProject({ folder: store.folder });

    expect(
      opened.ok && opened.value.read().project.outputs[0]?.platforms,
    ).toEqual(["youtube"]);
  });
});
