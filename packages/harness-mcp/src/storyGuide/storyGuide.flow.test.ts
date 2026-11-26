import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

async function guideText(): Promise<string> {
  const harness = await startHarness();
  const result = await harness.call({ name: "get_story_guide" });
  return String(result.data["guide"]);
}

describe("get_story_guide on the work with the person", () => {
  it("names ask_person and takes in its description, so the lead reads it before the questions", async () => {
    const harness = await startHarness();
    const { tools } = await harness.client.listTools();
    const description =
      tools.find((tool) => tool.name === "get_story_guide")?.description ?? "";

    expect(description).toContain("questions in rounds with ask_person");
    expect(description).toContain(
      "a take of the pictures, the clips, and the cut of each chapter",
    );
    expect(description).toContain("Call it first, before the questions");
  });

  it("puts the steps first: questions in rounds, the story in a take, chapters, and a take for each step", async () => {
    const guide = await guideText();

    expect(guide.indexOf("## Work with the person")).toBeLessThan(
      guide.indexOf("## Story first"),
    );
    expect(guide).toContain("call ask_person, then end your turn");
    expect(guide).toContain("Ask 3 to 6 short questions in a round.");
    expect(guide).toContain('Add no option such as "Other"');
    expect(guide).toContain(
      "Ask another round only when a choice that changes the story is still open.",
    );
    expect(guide).toContain(
      'Call open_take with step story, write the whole story with set_story, and call ready_take with the item "story".',
    );
    expect(guide).toContain(
      "give the plan chapters of about 1 to 3 minutes, and tell the person the split in one short message",
    );
    expect(guide).toContain(
      "Call open_take with step pictures and its chapter_id.",
    );
    expect(guide).toContain(
      "render the chapter with render_video and chapter_id",
    );
    expect(guide).not.toContain("## The order of work");
  });

  it("asks for an honest note, what to check, the price of the next step, and a new take of only the marked items", async () => {
    const guide = await guideText();

    expect(guide).toContain(
      "what it is, and what you see wrong in it or suspect",
    );
    expect(guide).toContain(
      "Give what_to_check for each clip, music, and cut, with the seconds. You cannot watch motion or hear sound",
    );
    expect(guide).toContain(
      "End your turn with one short line: the take is ready, and the price of the next step.",
    );
    expect(guide).toContain("offer fewer items: the ones that matter most");
    expect(guide).toContain(
      "Make again only the items that have mistakes, in a new take of the same step, with replaces_asset_id.",
    );
    expect(guide).toContain(
      'Put each "Use this" pick into the film as it is, because the person chose that version for its place, also an older one. Remake nothing for that place, and never undo a pick.',
    );
    expect(guide).toContain(
      "When the person is not sure about an item, answer in that new take",
    );
    expect(guide).toContain(
      "A take with no note is a yes: go on to the next step at once.",
    );
  });

  it("teaches the craft of the trailer runs as principles with their reasons", async () => {
    const guide = await guideText();

    expect(guide).toContain(
      "The viewer feels a loss only after seeing what was lost",
    );
    expect(guide).toContain("A fight needs stakes: the enemies fight back");
    expect(guide).toContain(
      "Open each new place on a wide shot before the close ones.",
    );
    expect(guide).toContain("Start a fight wide, then go close");
    expect(guide).toContain(
      "A shot needs no link to the shot before it, because each one comes from another part of the film.",
    );
    expect(guide).toContain(
      "A place makes sense as something that people built and use",
    );
    expect(guide).toContain(
      "Give each character one voice, and write it the same way in each clip prompt",
    );
    expect(guide).toContain(
      "Inside one moment, a character who changes place moves on screen, or a shot shows the way.",
    );
    expect(guide).toContain(
      "The music comes before the cut, because the cut follows the music",
    );
    expect(guide).not.toContain("The person picks by ear in the Music view.");
  });
});
