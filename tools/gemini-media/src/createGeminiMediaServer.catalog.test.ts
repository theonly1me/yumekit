import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { callVideo } from "./testing/callVideo.ts";
import {
  connectGeminiMedia,
  inOrder,
  resultText,
  temporaryFolder,
} from "./testing/connectGeminiMedia.ts";
import {
  completedInteraction,
  sampleVideo,
} from "./testing/fakeInteractions.ts";

const settingSchema = z.object({
  name: z.string(),
  kind: z.enum([
    "choice",
    "whole-number",
    "switch",
    "image-file",
    "image-files",
  ]),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const descriptionSchema = z.object({
  models: z.array(z.object({ settings: z.array(settingSchema) })),
});

async function describeServer() {
  const media = await connectGeminiMedia({
    environment: {},
    respond: inOrder([]),
  });
  const result = await media.callTool({
    name: "describe_media_server",
    arguments: {},
  });
  return { result, requests: media.requests };
}

async function settingValue(
  setting: z.infer<typeof settingSchema>,
): Promise<unknown> {
  const image = join(await temporaryFolder(), "frame.png");
  await writeFile(image, "frame");
  if (setting.kind === "image-file") return image;
  if (setting.kind === "image-files") return [image];
  return setting.default;
}

describe("describe_media_server", () => {
  it("describes the Gemini video model, its prices per second, and the key, with no key and no request", async () => {
    const { result, requests } = await describeServer();

    expect(requests).toHaveLength(0);
    expect(result.structuredContent).toMatchObject({
      label: "Google Gemini",
      runs: "hosted",
      keys: [
        {
          variable: "GEMINI_API_KEY",
          get_key_url: "https://aistudio.google.com/apikey",
        },
      ],
      models: [
        {
          id: "gemini-omni-1.2-flash",
          capability: "video",
          is_default: true,
          read_on: "2026-11-21",
          prices: [
            { usd: 0.07, unit: "second", when: { resolution: "720p" } },
            { usd: 0.104, unit: "second", when: { resolution: "1080p" } },
          ],
        },
      ],
    });
  });

  it("lists settings that generate_video accepts: each default value gives no input failure", async () => {
    const { result } = await describeServer();
    const description = descriptionSchema.parse(result.structuredContent);
    const settings = description.models.flatMap((model) => model.settings);

    expect(settings.map((setting) => setting.name)).toEqual([
      "duration_seconds",
      "resolution",
      "first_frame_path",
      "last_frame_path",
      "reference_image_paths",
    ]);
    for (const setting of settings) {
      const firstFrame =
        setting.name === "last_frame_path"
          ? {
              first_frame_path: await settingValue({
                ...setting,
                kind: "image-file",
              }),
            }
          : {};
      const call = await callVideo({
        respond: inOrder([
          () => completedInteraction({ id: "v1_catalog", video: sampleVideo }),
        ]),
        arguments: {
          ...firstFrame,
          [setting.name]: await settingValue(setting),
        },
      });

      expect(resultText(call.result), setting.name).not.toContain("must");
      expect(call.result.isError, setting.name).toBeUndefined();
    }
  });
});
