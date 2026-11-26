import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  makePictures,
  putCastMember,
  startCastHarness,
} from "../testing/castFixture.js";
import type { Harness } from "../testing/harnessFixture.js";

function picturePath(options: { harness: Harness; assetId: string }): string {
  return join(
    options.harness.folder,
    "assets",
    "files",
    `${options.assetId}.png`,
  );
}

async function castHarness(): Promise<Harness> {
  const harness = await startCastHarness();
  await makePictures({
    harness,
    assetIds: ["mia-1", "mia-2", "mug-1", "mug-2"],
  });
  await putCastMember({
    harness,
    castId: "mia",
    description: "A woman with short black hair",
    pictureIds: ["mia-1", "mia-2"],
  });
  await putCastMember({
    harness,
    castId: "mug",
    description: "A blue mug.",
    pictureIds: ["mug-1", "mug-2"],
  });
  return harness;
}

function castPicture(options: {
  harness: Harness;
  model: string;
  castIds: string[];
}) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "shot",
      capability: "image",
      server: "keyed",
      model: options.model,
      input: { prompt: "A kitchen" },
      cast_ids: options.castIds,
    },
  });
}

describe("generate_asset with cast_ids", () => {
  it("sends the reference pictures of the entry, and the prompt byte for byte, to a model that accepts reference pictures", async () => {
    const harness = await castHarness();

    const result = await castPicture({
      harness,
      model: "keyed-image-large",
      castIds: ["mia"],
    });

    expect(result.isError).toBe(false);
    expect(harness.runRequests.at(-1)?.input).toMatchObject({
      prompt: "A kitchen",
      reference_image_paths: [
        picturePath({ harness, assetId: "mia-1" }),
        picturePath({ harness, assetId: "mia-2" }),
      ],
    });
    expect(harness.store.read().assets.at(-1)?.source).toMatchObject({
      input: { reference_asset_ids: ["mia-1", "mia-2"] },
    });
  });

  it("sends no more reference pictures than the model accepts", async () => {
    const harness = await castHarness();

    await castPicture({
      harness,
      model: "keyed-image-large",
      castIds: ["mia", "mug"],
    });

    expect(harness.runRequests.at(-1)?.input).toMatchObject({
      prompt: "A kitchen",
      reference_image_paths: [
        picturePath({ harness, assetId: "mia-1" }),
        picturePath({ harness, assetId: "mia-2" }),
        picturePath({ harness, assetId: "mug-1" }),
      ],
    });
  });

  it("sends only the prompt as written to a model that takes no reference pictures", async () => {
    const harness = await castHarness();

    await castPicture({ harness, model: "keyed-image", castIds: ["mug"] });

    const input = harness.runRequests.at(-1)?.input;
    expect(input?.["prompt"]).toBe("A kitchen");
    expect(input).not.toHaveProperty("reference_image_paths");
  });

  it("fails with the cast ids for an unknown entry and calls no media tool", async () => {
    const harness = await castHarness();
    const callsBefore = harness.runRequests.length;

    const result = await castPicture({
      harness,
      model: "keyed-image-large",
      castIds: ["max"],
    });

    expect(result.data["kind"]).toBe("cast-member-not-found");
    expect(result.data["hint"]).toContain("mia, mug");
    expect(harness.runRequests).toHaveLength(callsBefore);
  });

  it("refuses cast_ids for a voice", async () => {
    const harness = await castHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "line",
        capability: "speech",
        input: { text: "Hello" },
        cast_ids: ["mia"],
      },
    });

    expect(result.data["kind"]).toBe("invalid-value");
  });
});
