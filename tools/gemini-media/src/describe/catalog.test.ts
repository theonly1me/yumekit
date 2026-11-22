import { describe, expect, it } from "vitest";
import { catalog, catalogEntries } from "./catalog.ts";

const capabilities = ["image", "speech", "music", "video"];

describe("the gemini-media catalog", () => {
  it("names the page of the Gemini API documents that each model entry comes from", () => {
    for (const entry of catalogEntries) {
      expect(entry.sourceUrl, entry.model.id).toMatch(
        /^https:\/\/aistudio\.google\.com\/docs\/[a-z0-9.-]+(\/[a-z0-9.-]+)?$/,
      );
    }
  });

  it("lists picture, voice, music, and video models with one default for each kind", () => {
    const idsByCapability = capabilities.map((capability) => ({
      capability,
      ids: catalog.models
        .filter((model) => model.capability === capability)
        .map((model) => model.id),
      defaults: catalog.models
        .filter((model) => model.capability === capability && model.is_default)
        .map((model) => model.id),
    }));

    expect(idsByCapability).toEqual([
      {
        capability: "image",
        ids: [
          "gemini-nano-banana-2.1",
          "gemini-3.1-flash-image",
          "gemini-3-pro-image",
          "gemini-3.1-flash-lite-image",
        ],
        defaults: ["gemini-nano-banana-2.1"],
      },
      {
        capability: "speech",
        ids: ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"],
        defaults: ["gemini-3.8-flash-tts"],
      },
      {
        capability: "music",
        ids: ["lyria-3.5", "lyria-3-clip-preview"],
        defaults: ["lyria-3.5"],
      },
      {
        capability: "video",
        ids: ["gemini-omni-1.2-flash"],
        defaults: ["gemini-omni-1.2-flash"],
      },
    ]);
  });

  it("marks each model as not tested with yumekit, because no real call ran", () => {
    expect(catalog.models.map((model) => model.tested)).toEqual(
      catalog.models.map(() => false),
    );
  });

  it("says which models take reference pictures and frames", () => {
    expect(
      Object.fromEntries(
        catalog.models.map((model) => [model.id, model.accepts]),
      ),
    ).toEqual({
      "gemini-nano-banana-2.1": ["reference_images"],
      "gemini-3.1-flash-image": ["reference_images"],
      "gemini-3-pro-image": ["reference_images"],
      "gemini-3.1-flash-lite-image": [],
      "gemini-3.8-flash-tts": undefined,
      "gemini-3.8-flash-lite-tts": undefined,
      "lyria-3.5": ["reference_images"],
      "lyria-3-clip-preview": ["reference_images"],
      "gemini-omni-1.2-flash": [
        "first_frame",
        "last_frame",
        "reference_images",
      ],
    });
  });
});
