import { describe, expect, it } from "vitest";
import { approvePicturesFirstOf, chaptersOf, openProject } from "../index.js";
import { readProjectFile } from "../testing/projectFixtures.js";
import { planOf, projectWithPlan } from "../testing/takeFixtures.js";

const harbor = { id: "harbor", title: "The harbor", shotIds: ["a", "b"] };
const crossing = { id: "crossing", title: "The crossing", shotIds: ["c"] };

describe("chapters of the story plan", () => {
  it("a plan with no chapters is one chapter of every shot", () => {
    expect(chaptersOf(planOf(["a", "b"]))).toEqual([
      { id: "film", title: "The whole film", shotIds: ["a", "b"] },
    ]);
  });

  it("setChapters stores the chapters in bible.json, and undo removes them", async () => {
    const store = await projectWithPlan(["a", "b", "c"]);
    const set = await store.applyEdits([
      { kind: "setChapters", chapters: [harbor, crossing] },
    ]);
    expect(set.ok).toBe(true);
    expect(
      JSON.parse(await readProjectFile({ store, file: "bible.json" })),
    ).toMatchObject({ storyPlan: { chapters: [harbor, crossing] } });
    await store.undo();
    expect(store.read().bible.storyPlan?.chapters).toBeUndefined();
    const opened = await openProject({ folder: store.folder });
    expect(
      opened.ok && chaptersOf(opened.value.read().bible.storyPlan),
    ).toEqual([
      { id: "film", title: "The whole film", shotIds: ["a", "b", "c"] },
    ]);
  });

  it.each([
    { refusal: "chapter-misses-shot", chapters: [harbor] },
    {
      refusal: "shot-in-two-chapters",
      chapters: [harbor, { ...crossing, shotIds: ["b", "c"] }],
    },
    {
      refusal: "chapters-break-order",
      chapters: [
        { ...harbor, shotIds: ["a", "c"] },
        { ...crossing, shotIds: ["b"] },
      ],
    },
  ])(
    "setChapters refuses $refusal and changes nothing",
    async ({ refusal, chapters }) => {
      const store = await projectWithPlan(["a", "b", "c"]);
      const before = store.read().revision;
      const set = await store.applyEdits([{ kind: "setChapters", chapters }]);
      expect(set.ok || set.failure.kind).toBe(refusal);
      expect(store.read().revision).toBe(before);
    },
  );

  it("a new plan that leaves out a shot of a chapter is refused", async () => {
    const store = await projectWithPlan(["a", "b", "c"]);
    await store.applyEdits([
      { kind: "setChapters", chapters: [harbor, crossing] },
    ]);
    const changed = await store.applyEdits([
      {
        kind: "setBible",
        bible: {
          ...store.read().bible,
          storyPlan: { ...planOf(["a", "b"]), chapters: [harbor, crossing] },
        },
      },
    ]);
    expect(changed.ok || changed.failure.kind).toBe("not-found");
  });

  it("setChapters with an empty list makes the film one chapter again", async () => {
    const store = await projectWithPlan(["a", "b", "c"]);
    await store.applyEdits([
      { kind: "setChapters", chapters: [harbor, crossing] },
    ]);
    await store.applyEdits([{ kind: "setChapters", chapters: [] }]);
    expect(store.read().bible.storyPlan?.chapters).toBeUndefined();
  });
});

describe("approve pictures before clips", () => {
  it("is on for a project with no setting, and only false is written", async () => {
    const store = await projectWithPlan(["a"]);
    expect(approvePicturesFirstOf(store.read().project)).toBe(true);
    await store.applyEdits([
      { kind: "setApprovePicturesFirst", approvePicturesFirst: false },
    ]);
    expect(
      JSON.parse(await readProjectFile({ store, file: "project.json" })),
    ).toMatchObject({ approvePicturesFirst: false });
    await store.applyEdits([
      { kind: "setApprovePicturesFirst", approvePicturesFirst: true },
    ]);
    expect(store.read().project).not.toHaveProperty("approvePicturesFirst");
    expect(approvePicturesFirstOf(store.read().project)).toBe(true);
  });
});
