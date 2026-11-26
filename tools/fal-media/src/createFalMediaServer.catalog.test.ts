import { describe, expect, it } from "vitest";
import { describeWithNoKey } from "./testing/describedModels.ts";

const makersOf = (ids: string[]) =>
  new Set(ids.map((id) => id.split("/")[0] ?? id));

describe("describe_media_server", () => {
  it("works with no key and sends no request", async () => {
    const { media, parsed } = await describeWithNoKey();

    expect(media.requests).toHaveLength(0);
    expect(parsed.keys.map((key) => key.variable)).toEqual(["FAL_KEY"]);
    for (const capability of [
      "image",
      "video",
      "sound-effect",
      "talking-clip",
      "sharper",
    ]) {
      expect(
        parsed.models.filter(
          (model) => model.capability === capability && model.is_default,
        ),
        capability,
      ).toHaveLength(1);
    }
  });

  it("lists at least 6 picture models and 6 video models from different makers", async () => {
    const { parsed } = await describeWithNoKey();
    const idsOf = (capability: string) =>
      parsed.models
        .filter((model) => model.capability === capability)
        .map((model) => model.id);

    expect(makersOf(idsOf("image")).size).toBeGreaterThanOrEqual(6);
    expect(makersOf(idsOf("video")).size).toBeGreaterThanOrEqual(6);
  });

  it("lists at least 2 sound effect models, and 2 sharper and 2 talking clip models each for pictures and for video", async () => {
    const { parsed } = await describeWithNoKey();
    const countOf = (options: { capability: string; accepts?: string }) =>
      parsed.models.filter(
        (model) =>
          model.capability === options.capability &&
          (options.accepts === undefined ||
            model.accepts.some((input) => input === options.accepts)),
      ).length;

    expect(countOf({ capability: "sound-effect" })).toBeGreaterThanOrEqual(2);
    expect(
      countOf({ capability: "sharper", accepts: "image_input" }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      countOf({ capability: "sharper", accepts: "video_input" }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      countOf({ capability: "talking-clip", accepts: "image_input" }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      countOf({ capability: "talking-clip", accepts: "video_input" }),
    ).toBeGreaterThanOrEqual(2);
  });

  it("keeps Seedance 2.5 as the default video model with the per second prices of its fal page, and takes reference pictures through its reference endpoint", async () => {
    const { parsed } = await describeWithNoKey();
    const seedance = parsed.models.find(
      (model) => model.id === "bytedance/seedance-2.5/us",
    );

    expect(seedance?.is_default).toBe(true);
    expect(seedance?.accepts).toEqual([
      "first_frame",
      "last_frame",
      "reference_images",
    ]);
    expect(seedance?.prices).toEqual([
      { usd: 0.2205, unit: "second", when: { resolution: "480p" } },
      { usd: 0.473, unit: "second", when: { resolution: "720p" } },
      { usd: 1.164, unit: "second", when: { resolution: "1080p" } },
      { usd: 1.84, unit: "second", when: { resolution: "4k" } },
    ]);
  });

  it("marks each model as not tested with yumekit, because no real call ran yet", async () => {
    const { parsed } = await describeWithNoKey();

    expect(parsed.models.filter((model) => model.tested)).toEqual([]);
  });

  it("offers a reference pictures setting exactly when a model accepts reference pictures", async () => {
    const { parsed } = await describeWithNoKey();

    for (const model of parsed.models) {
      const names = model.settings.map((entry) => entry.name);
      expect(names.includes("reference_image_paths"), model.id).toBe(
        model.accepts.includes("reference_images"),
      );
      expect(names.includes("last_frame_path"), model.id).toBe(
        model.accepts.includes("last_frame"),
      );
    }
  });

  it("names only settings that are input fields of the tool of the model", async () => {
    const { media, parsed } = await describeWithNoKey();
    const fieldsOf = {
      image: await media.inputFieldsOf("generate_image"),
      video: await media.inputFieldsOf("generate_video"),
      "sound-effect": await media.inputFieldsOf("generate_sound_effect"),
      "talking-clip": await media.inputFieldsOf("generate_talking_clip"),
      sharper: await media.inputFieldsOf("sharpen_media"),
    };

    for (const model of parsed.models) {
      for (const entry of model.settings) {
        expect(fieldsOf[model.capability], model.id).toContain(entry.name);
      }
    }
  });
});
