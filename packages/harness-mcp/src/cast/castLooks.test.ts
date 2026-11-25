import { describe, expect, it } from "vitest";
import { dressSmith, smithLook } from "../testing/designFixture.js";
import { makeForgeSheets, startStoryHarness } from "../testing/storyFixture.js";

const cloakLook = {
  look_id: "rain-cloak",
  name: "Rain cloak",
  clothes: ["A hooded oilcloth cloak over the leather apron"],
  props: [{ name: "hammer", count: 1, side: "in her right hand" }],
};

describe("the looks of a person", () => {
  it("put_cast_member keeps base facts apart from the clothes and props of each look, and get_project shows them", async () => {
    const harness = await startStoryHarness();
    await makeForgeSheets(harness);

    const saved = await dressSmith({ harness });
    const project = await harness.call({ name: "get_project" });
    const [, smith] = harness.store.read().bible.cast;

    expect(saved.isError).toBe(false);
    expect(smith).toMatchObject({
      facts: ["The hammer is in her right hand"],
      referenceAssetIds: ["smith-sheet"],
      looks: [
        {
          id: "default",
          clothes: ["A long leather apron over a sleeveless grey tunic"],
          props: [{ name: "hammer", count: 1, side: "in her right hand" }],
          sheets: [],
        },
      ],
    });
    expect(JSON.stringify(project.data)).toContain(
      "Exactly 1 hammer, in her right hand",
    );
    expect(saved.data["cast_member"]).toMatchObject({
      looks: [
        {
          look_id: "default",
          sheets: [{ asset_id: "smith-sheet", kind: "turnaround" }],
        },
      ],
    });
  });

  it("a new look of a person who exists is the decision of the person, and the entry records the words", async () => {
    const harness = await startStoryHarness();
    await makeForgeSheets(harness);
    await dressSmith({ harness });

    const refused = await dressSmith({
      harness,
      looks: [smithLook, cloakLook],
    });
    const words = "In the storm she wears her rain cloak.";
    const asked = await dressSmith({
      harness,
      looks: [smithLook, { ...cloakLook, person_asked_for_it: words }],
    });
    const again = await dressSmith({
      harness,
      looks: [smithLook, cloakLook],
    });
    const [, smith] = harness.store.read().bible.cast;

    expect(refused.data).toMatchObject({ kind: "look-needs-person" });
    expect(asked.isError).toBe(false);
    expect(again.isError).toBe(false);
    expect(smith?.looks?.[1]).toMatchObject({
      id: "rain-cloak",
      personAsked: { words },
    });
  });
});
