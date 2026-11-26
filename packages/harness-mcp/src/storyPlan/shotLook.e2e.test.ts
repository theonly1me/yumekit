import { describe, expect, it } from "vitest";
import { dressSmith, smithLook } from "../testing/designFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
  shotOf,
  startStoryHarness,
} from "../testing/storyFixture.js";

const cloakLook = {
  look_id: "rain-cloak",
  name: "Rain cloak",
  clothes: ["A hooded oilcloth cloak over the leather apron"],
  props: [{ name: "hammer", count: 1, side: "in her right hand" }],
  person_asked_for_it: "In the storm she wears her rain cloak.",
};

async function storyWithTwoLooks(): Promise<Harness> {
  const harness = await startStoryHarness({ videoStyle: "ai-video" });
  await makeForgeSheets(harness);
  await dressSmith({ harness, looks: [smithLook, cloakLook] });
  await harness.call({
    name: "set_story_plan",
    arguments: {
      logline: "A smith forges a blade in a storm.",
      want: "A blade that will not break",
      obstacle: "The rain cools the steel",
      change: "She shields the steel with her cloak",
      shots: [
        shotOf({ shot_id: "strike" }),
        {
          ...shotOf({ shot_id: "storm" }),
          cast_looks: { smith: "rain-cloak" },
        },
      ],
    },
  });
  return harness;
}

describe("the look of each person in a shot", () => {
  it("a shot names the look, and get_shot_brief gives the base facts with that look and its sheets", async () => {
    const harness = await storyWithTwoLooks();

    const storm = await harness.call({
      name: "get_shot_brief",
      arguments: { shot_id: "storm" },
    });
    const strike = await harness.call({
      name: "get_shot_brief",
      arguments: { shot_id: "strike" },
    });

    expect(harness.store.read().bible.storyPlan?.shots[1]?.castLooks).toEqual({
      smith: "rain-cloak",
    });
    expect(storm.text).toContain("Base facts: The hammer is in her right hand");
    expect(storm.text).toContain(
      'Look in this shot: "rain-cloak" (Rain cloak), chosen by the person',
    );
    expect(storm.text).toContain(
      "Clothes: A hooded oilcloth cloak over the leather apron.",
    );
    expect(storm.text).not.toContain("sleeveless grey tunic");
    expect(strike.text).toContain(
      "Clothes: A long leather apron over a sleeveless grey tunic.",
    );
    expect(JSON.stringify(strike.data["cast"])).toContain(
      '"look_id":"default"',
    );
    expect(JSON.stringify(strike.data["cast"])).toContain(
      '"props":["Exactly 1 hammer, in her right hand"],"sheets":[{"asset_id":"smith-sheet","kind":"turnaround"}]',
    );
  });

  it("get_work proposes the poses that the shots of a look need, and a pose sheet records them for the brief", async () => {
    const harness = await storyWithTwoLooks();

    const work = await harness.call({
      name: "get_work",
      arguments: { part: "story" },
    });
    const made = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "smith-poses",
        capability: "image",
        sheet_of: "smith",
        sheet_kind: "poses",
        input: { prompt: "Smith poses", width_pixels: 32, height_pixels: 18 },
      },
    });
    await dressSmith({
      harness,
      looks: [
        {
          ...smithLook,
          sheets: [
            ...smithLook.sheets,
            { asset_id: "smith-poses", kind: "poses" },
          ],
        },
        cloakLook,
      ],
    });
    const brief = await harness.call({
      name: "get_shot_brief",
      arguments: { shot_id: "strike" },
    });
    const pose = "strike: the blade is straight; faces camera";

    expect(work.text).toContain(`- smith, look "default": "${pose}"`);
    expect(work.text).toContain('- smith, look "rain-cloak": "storm: ');
    expect(made.isError).toBe(false);
    expect(
      harness.store.read().bible.cast[1]?.looks?.[0]?.sheets[0]?.poses,
    ).toEqual([pose]);
    expect(brief.text).toContain(
      `Nearest pose to the start of this shot: "${pose}" on the pose sheet "smith-poses"`,
    );
  });
});
