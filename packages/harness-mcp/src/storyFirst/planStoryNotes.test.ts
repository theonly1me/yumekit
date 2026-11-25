import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import {
  notesOf,
  setStoryPlan,
  writeStory,
} from "../testing/wholeStoryFixture.js";
import {
  missingFormNote,
  missingStoryNote,
  trailerFormNote,
} from "./planStoryNotes.js";

describe("the story notes of set_story_plan", () => {
  it("saves a plan of shots with no story behind it, with a note that says what is missing", async () => {
    const harness = await startHarness();

    const result = await setStoryPlan({
      harness,
      form: "short",
      shots: [{ shot_id: "nets" }],
    });

    expect(result.isError).toBe(false);
    expect(harness.store.read().bible.storyPlan?.shots).toHaveLength(1);
    expect(notesOf(result)).toEqual([missingStoryNote]);
    expect(result.text).toContain(
      "the world and its rule; each main character with background, want, fear, and what they do not know; the opposing force and why it acts",
    );
  });

  it("notes a film with no form, and gives the craft of a trailer for a trailer", async () => {
    const harness = await startHarness();
    await writeStory({
      harness,
      changes: { approval: "request-said-go-ahead" },
    });

    const noForm = await setStoryPlan({ harness, shots: [{ shot_id: "a" }] });
    const trailer = await setStoryPlan({
      harness,
      form: "trailer",
      shots: [{ shot_id: "a" }],
    });

    expect(notesOf(noForm)).toEqual([missingFormNote]);
    expect(notesOf(trailer)).toEqual([trailerFormNote]);
    expect(harness.store.read().bible.storyPlan?.form).toBe("trailer");
  });

  it("stores the story fact of each shot, and notes one that is not in the story and a spoken line with none", async () => {
    const harness = await startHarness();
    await writeStory({ harness, changes: { approval: "person-said-yes" } });

    const result = await setStoryPlan({
      harness,
      form: "trailer",
      shots: [
        { shot_id: "nets", story_fact: "the-nets" },
        { shot_id: "bell", story_fact: "the-bell" },
        {
          shot_id: "says",
          video_prompt: 'He whispers "the lake keeps what it takes".',
        },
      ],
    });
    const shots = harness.store.read().bible.storyPlan?.shots ?? [];

    expect(shots.map((shot) => shot.storyFact)).toEqual([
      "the-nets",
      "the-bell",
      undefined,
    ]);
    expect(notesOf(result).slice(1)).toEqual([
      'Note: shot "bell" names story_fact "the-bell", which is not a part of the story. The parts: premise, world, oda, keeper, the-nets, the-ring, the-hole, unknown.',
      'Note: shot "says" has words in quotes (a spoken line or a text) and no story_fact. Each spoken line comes from the story: give the id of the part that it says.',
    ]);
  });

  it("reminds the lead to ask the person while the story has no yes", async () => {
    const harness = await startHarness();
    await writeStory({ harness });

    const result = await setStoryPlan({
      harness,
      form: "short",
      shots: [{ shot_id: "nets", story_fact: "the-nets" }],
    });

    expect(notesOf(result)).toEqual([
      "Note: the person has not said yes to the story yet. Show it in plain words and ask, and make nothing else until the answer, unless the request says in words to go ahead without asking.",
    ]);
  });
});
