import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import {
  notesOf,
  setStoryPlan,
  writeStory,
} from "../testing/wholeStoryFixture.js";
import { missingFormNote, trailerFormNote } from "./planStoryNotes.js";

describe("the form on the story", () => {
  it("keeps the form of set_story, and get_work shows it with the story", async () => {
    const harness = await startHarness();

    const written = await writeStory({ harness, changes: { form: "trailer" } });
    const work = await harness.call({ name: "get_work" });

    expect(harness.store.read().bible.story?.form).toBe("trailer");
    expect(written.text).toContain("The form of the film: trailer.");
    expect(work.text).toContain("Form of the film: trailer");
  });

  it("asks for the form in set_story when the story has none", async () => {
    const harness = await startHarness();

    const written = await writeStory({ harness });

    expect(written.text).toContain(missingFormNote);
    expect(missingFormNote).toContain("to set_story");
  });

  it("gives a plan with no form the form of the story, with no note about a missing form", async () => {
    const harness = await startHarness();
    await writeStory({
      harness,
      changes: { form: "trailer", approval: "person-said-yes" },
    });

    const plan = await setStoryPlan({ harness, shots: [{ shot_id: "a" }] });

    expect(notesOf(plan)).toEqual([trailerFormNote]);
  });

  it("notes a plan whose form differs from the form of the story, and the film follows the story", async () => {
    const harness = await startHarness();
    await writeStory({
      harness,
      changes: { form: "short", approval: "person-said-yes" },
    });

    const plan = await setStoryPlan({
      harness,
      form: "trailer",
      shots: [{ shot_id: "a" }],
    });

    expect(notesOf(plan)).toEqual([
      "Note: the plan gives the form trailer, and the story gives short. The film follows the story: short. Leave form out of set_story_plan, or change it with set_story.",
    ]);
  });

  it("shows the form of the plan for a story of WP74 with no form", async () => {
    const harness = await startHarness();
    await writeStory({ harness, changes: { approval: "person-said-yes" } });

    const plan = await setStoryPlan({
      harness,
      form: "short",
      shots: [{ shot_id: "a" }],
    });
    const work = await harness.call({ name: "get_work" });

    expect(notesOf(plan)).toEqual([]);
    expect(work.text).toContain(
      "Form of the film: short (from the story plan; give form to set_story)",
    );
  });
});
