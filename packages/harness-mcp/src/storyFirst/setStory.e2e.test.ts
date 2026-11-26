import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import { bellStory, writeStory } from "../testing/wholeStoryFixture.js";

describe("set_story", () => {
  it("stores the whole story as one undo step and gives the ids for story_fact", async () => {
    const harness = await startHarness();

    const result = await writeStory({ harness });
    const stored = harness.store.read().bible.story;
    await harness.call({ name: "undo" });

    expect(result.isError).toBe(false);
    expect(stored).toMatchObject({
      premise: bellStory.premise,
      worldRule: "The bell rings once before a death.",
      characters: [{ id: "oda", fear: "a winter alone" }],
      opposingForce: {
        id: "keeper",
        why: "He rings the bell so that nobody dies without a goodbye.",
      },
      arc: [{ id: "the-nets" }, { id: "the-ring" }, { id: "the-hole" }],
      unknownAtEnd: "Whether she silences the bell.",
    });
    expect(result.data["story_part_ids"]).toEqual([
      "premise",
      "world",
      "oda",
      "keeper",
      "the-nets",
      "the-ring",
      "the-hole",
      "unknown",
    ]);
    expect(harness.store.read().bible.story).toBeUndefined();
  });

  it("asks the lead to give the story in a take until the person says yes, and keeps the yes only for the same story", async () => {
    const harness = await startHarness();

    const first = await writeStory({ harness });
    const yes = await writeStory({
      harness,
      changes: { approval: "person-said-yes" },
    });
    const same = await writeStory({ harness });
    const changed = await writeStory({
      harness,
      changes: { unknown_at_end: "Whether Ivo lives." },
    });

    expect(first.text).toContain(
      'Give it to the person in a take of the story: ready_take with the item "story" (open_take with step story first, when no take of the story is open). Then end the turn',
    );
    expect(first.data["approval"]).toBe("not-asked-yet");
    expect(yes.text).toContain("The person said yes to this story.");
    expect(same.data["approval"]).toBe("person-said-yes");
    expect(changed.data["approval"]).toBe("not-asked-yet");
  });

  it("refuses an id that two parts of the story share, and changes nothing", async () => {
    const harness = await startHarness();

    const result = await writeStory({
      harness,
      changes: {
        arc: [
          { step_id: "oda", step: "One." },
          { step_id: "two", step: "Two." },
          { step_id: "world", step: "Three." },
        ],
      },
    });

    expect(result.data).toMatchObject({ kind: "id-in-use" });
    expect(String(result.data["message"])).toContain("oda, world");
    expect(harness.store.read().bible.story).toBeUndefined();
  });

  it("gives the story in get_work first, above the cast and the shots", async () => {
    const harness = await startHarness();
    await writeStory({ harness });

    const work = await harness.call({
      name: "get_work",
      arguments: { part: "story" },
    });
    const storyAt = work.text.indexOf("### The story");

    expect(work.text).toContain(`[premise] ${bellStory.premise}`);
    expect(work.text).toContain(
      "Opposing force: [keeper] The Keeper of the Bell: A miller who drowned a hundred years ago. Why it acts: He rings the bell so that nobody dies without a goodbye.",
    );
    expect(work.text).toContain("2. [the-ring] The bell rings under her feet.");
    expect(work.text).toContain(
      "The person has not said yes to this story yet.",
    );
    expect(storyAt).toBeGreaterThan(0);
    expect(storyAt).toBeLessThan(work.text.indexOf("Cast:"));
    expect(storyAt).toBeLessThan(work.text.indexOf("### Story plan"));
  });

  it("links a person of the cast to a character of the story, and notes a link to no character", async () => {
    const harness = await startHarness();
    await writeStory({ harness });
    const cast = (storyCharacterId: string) =>
      harness.call({
        name: "put_cast_member",
        arguments: {
          cast_id: "girl",
          kind: "person",
          name: "Oda",
          description: "A girl in a grey wool coat",
          story_character_id: storyCharacterId,
        },
      });

    const linked = await cast("oda");
    const stored = harness.store.read().bible.cast[0]?.storyCharacterId;
    const wrong = await cast("ivo");

    expect(stored).toBe("oda");
    expect(linked.data["warnings"]).toEqual([]);
    expect(wrong.data["warnings"]).toEqual([
      'Note: story_character_id "ivo" is not a character of the story. The characters: oda, keeper.',
    ]);
  });
});
