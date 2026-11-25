import { describe, expect, it } from "vitest";
import { filmFormOf, openProject } from "../index.js";
import {
  createTestProject,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const storyOfWp74 = {
  premise: "A girl goes under the ice to silence a bell.",
  world: "A fishing village on a frozen lake.",
  worldRule: "The bell rings once before a death.",
  characters: [
    {
      id: "oda",
      name: "Oda",
      background: "Her grandfather raised her.",
      want: "to keep her grandfather",
      fear: "a winter alone",
      doesNotKnow: "her grandfather went under the ice once",
    },
  ],
  opposingForce: {
    id: "keeper",
    name: "The Keeper",
    what: "A drowned miller.",
    why: "Nobody dies without a goodbye.",
  },
  arc: [
    { id: "the-nets", text: "They mend nets." },
    { id: "the-ring", text: "The bell rings." },
    { id: "the-hole", text: "She cuts the ice." },
  ],
  unknownAtEnd: "Whether she silences the bell.",
  approval: "person-said-yes",
};

const planOfWp74 = {
  form: "short",
  logline: "A girl goes under the ice.",
  want: "to keep her grandfather",
  obstacle: "the keeper",
  change: "she learns why the bell rings",
  shots: [],
};

async function openedBibleOf(bible: object) {
  const store = await createTestProject();
  await writeProjectFile({
    folder: store.folder,
    file: "bible.json",
    content: JSON.stringify({
      style: "",
      palette: [],
      cast: [],
      voice: "",
      ...bible,
    }),
  });
  const opened = await openProject({ folder: store.folder });
  if (!opened.ok) throw new Error(opened.failure.kind);
  return opened.value.read().bible;
}

describe("the form of the film", () => {
  it("loads a project of WP74 with the form only on the plan, and takes the form of the plan", async () => {
    const bible = await openedBibleOf({
      story: storyOfWp74,
      storyPlan: planOfWp74,
    });

    expect(bible.story?.form).toBeUndefined();
    expect(filmFormOf({ story: bible.story, plan: bible.storyPlan })).toBe(
      "short",
    );
  });

  it("takes the form of the story over the form of the plan", async () => {
    const bible = await openedBibleOf({
      story: { ...storyOfWp74, form: "trailer" },
      storyPlan: planOfWp74,
    });

    expect(filmFormOf({ story: bible.story, plan: bible.storyPlan })).toBe(
      "trailer",
    );
  });
});
