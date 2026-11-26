import { describe, expect, it } from "vitest";
import { z } from "zod";
import { makeSheet, startStoryHarness } from "../testing/storyFixture.js";

const entryIds = ["anvil", "tongs", "bellows", "forge"];

const partsSchema = z.array(
  z.object({ id: z.string(), ok: z.boolean(), kind: z.string().optional() }),
);

async function sheetsHarness() {
  const harness = await startStoryHarness({
    critic: { waitMilliseconds: 300 },
  });
  for (const castId of entryIds) {
    await makeSheet({ harness, castId, kind: "prop", facts: [] });
  }
  return harness;
}

describe("several reviews at the same time", () => {
  it("reviews the sheets of different entries at the same time, at most three critic turns at once", async () => {
    const harness = await sheetsHarness();

    const answer = await harness.call({
      name: "review_several",
      arguments: {
        reviews: entryIds.map((castId) => ({
          tool: "review_sheet",
          cast_id: castId,
        })),
      },
    });

    expect(answer.data).toMatchObject({ worked: 4, failed: 0 });
    expect(harness.criticLog.mostAtOnce).toBe(3);
    expect(
      harness.store
        .read()
        .bible.cast.map((member) => member.sheetReview?.verdict),
    ).toEqual(entryIds.map(() => "pass"));
  });

  it("refuses a second review of the same work while the first one runs", async () => {
    const harness = await sheetsHarness();

    const answer = await harness.call({
      name: "review_several",
      arguments: {
        reviews: [
          { tool: "review_sheet", cast_id: "anvil" },
          { tool: "review_sheet", cast_id: "anvil" },
        ],
      },
    });

    expect(
      partsSchema
        .parse(answer.data["results"])
        .map((part) => (part.ok ? "reviewed" : part.kind)),
    ).toEqual(["reviewed", "review-running"]);
    expect(harness.criticLog.briefs).toHaveLength(1);
  });
});
