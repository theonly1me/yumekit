import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  connectFalMedia,
  placeholderKey,
  resultText,
  temporaryFolder,
  writeImage,
} from "./testing/connectFalMedia.ts";
import { fakeFal } from "./testing/fakeFal.ts";

const setting = z.discriminatedUnion("kind", [
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("choice"),
    choices: z.array(z.string()),
    default: z.string(),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("whole-number"),
    minimum: z.number(),
    maximum: z.number(),
    default: z.number(),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("switch"),
    default: z.boolean(),
  }),
  z.object({
    name: z.string(),
    label: z.string(),
    kind: z.literal("image-file"),
  }),
]);

const description = z.strictObject({
  label: z.string(),
  runs: z.enum(["hosted", "on-this-computer"]),
  keys: z.array(
    z.strictObject({
      variable: z.string(),
      label: z.string(),
      get_key_url: z.url(),
      steps: z.array(z.string()).min(1),
    }),
  ),
  models: z.array(
    z.strictObject({
      id: z.string(),
      label: z.string(),
      capability: z.literal("video"),
      is_default: z.boolean(),
      settings: z.array(setting),
      prices: z.array(
        z.strictObject({
          usd: z.number(),
          unit: z.literal("second"),
          when: z.record(z.string(), z.string()),
        }),
      ),
      read_on: z.iso.date(),
    }),
  ),
});

async function describeWithNoKey() {
  const media = await connectFalMedia({
    environment: {},
    respond: fakeFal({}),
  });
  const result = await media.callTool({
    name: "describe_media_server",
    arguments: {},
  });
  return { media, parsed: description.parse(result.structuredContent) };
}

describe("describe_media_server", () => {
  it("works with no key and sends no request", async () => {
    const { media, parsed } = await describeWithNoKey();

    expect(media.requests).toHaveLength(0);
    expect(parsed.keys.map((key) => key.variable)).toEqual(["FAL_KEY"]);
    expect(parsed.models.filter((model) => model.is_default)).toHaveLength(1);
  });

  it("shows Seedance 2.5 as one model with the per second prices of the fal model page", async () => {
    const { parsed } = await describeWithNoKey();

    expect(parsed.models.map((model) => model.id)).toEqual([
      "bytedance/seedance-2.5/us",
    ]);
    expect(parsed.models[0]?.prices).toEqual([
      { usd: 0.2205, unit: "second", when: { resolution: "480p" } },
      { usd: 0.473, unit: "second", when: { resolution: "720p" } },
      { usd: 1.164, unit: "second", when: { resolution: "1080p" } },
      { usd: 1.84, unit: "second", when: { resolution: "4k" } },
    ]);
  });

  it("names only settings that are input fields of generate_video", async () => {
    const { media, parsed } = await describeWithNoKey();
    const fields = await media.inputFieldsOf("generate_video");

    for (const model of parsed.models) {
      for (const entry of model.settings) expect(fields).toContain(entry.name);
    }
  });

  it("accepts the default value of each setting with no input failure", async () => {
    const { parsed } = await describeWithNoKey();
    const folder = await temporaryFolder();
    const firstFrame = await writeImage({ folder, name: "first.png" });
    const lastFrame = await writeImage({ folder, name: "last.png" });
    const imageInputs: Partial<Record<string, Record<string, string>>> = {
      first_frame_path: { first_frame_path: firstFrame },
      last_frame_path: {
        first_frame_path: firstFrame,
        last_frame_path: lastFrame,
      },
    };
    const media = await connectFalMedia({
      environment: { FAL_KEY: placeholderKey },
      respond: fakeFal({}),
    });
    for (const model of parsed.models) {
      for (const entry of model.settings) {
        const value =
          entry.kind === "image-file"
            ? imageInputs[entry.name]
            : { [entry.name]: entry.default };
        const result = await media.callTool({
          name: "generate_video",
          arguments: {
            prompt: "A lake",
            duration_seconds: 4,
            output_directory: folder,
            file_stem: `setting-${entry.name}`,
            model: model.id,
            ...value,
          },
        });
        expect(resultText(result), entry.name).not.toMatch(
          /must be|does not accept|needs/,
        );
        expect(result.isError, entry.name).toBeFalsy();
      }
    }
  });
});
