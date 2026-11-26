import { describe, expect, it } from "vitest";
import { z } from "zod";
import { callVideo } from "./testing/callVideo.ts";
import { connectSandMedia } from "./testing/connectSandMedia.ts";
import { fakeSand } from "./testing/fakeSand.ts";

const describedModels = z.object({
  models: z.array(
    z.object({
      settings: z.array(
        z.object({
          name: z.string(),
          default: z.union([z.string(), z.number(), z.boolean()]).optional(),
        }),
      ),
    }),
  ),
});

async function describeWithNoKey() {
  const media = await connectSandMedia({
    environment: {},
    respond: fakeSand({}),
  });
  const result = await media.callTool({
    name: "describe_media_server",
    arguments: {},
  });
  return { media, description: result.structuredContent };
}

describe("describe_media_server", () => {
  it("works with no key and sends no request", async () => {
    const { media, description } = await describeWithNoKey();

    expect(media.requests).toHaveLength(0);
    expect(description).toMatchObject({
      label: "Sand AI",
      runs: "hosted",
      keys: [
        {
          variable: "SAND_API_KEY",
          label: "Sand AI API key",
          get_key_url: "https://platform.sand.ai/app/keys/",
        },
      ],
    });
  });

  it("describes MAGI-2 with the price of its pricing page, 0.08 US dollars a second at 1080p, and no real call yet", async () => {
    const { description } = await describeWithNoKey();

    expect(description).toMatchObject({
      models: [
        {
          id: "magi-2",
          label: "MAGI-2",
          capability: "video",
          is_default: true,
          prices: [
            { usd: 0.08, unit: "second", when: { resolution: "1080p" } },
          ],
          read_on: "2026-11-26",
          accepts: ["first_frame", "last_frame", "reference_images"],
          tested: false,
        },
      ],
    });
  });

  it("names only settings that are input fields of generate_video, and the default of each setting makes a clip", async () => {
    const { media, description } = await describeWithNoKey();
    const fields = await media.inputFieldsOf("generate_video");
    const [model] = describedModels.parse(description).models;

    for (const setting of model?.settings ?? []) {
      expect(fields).toContain(setting.name);
      if (setting.default === undefined) continue;
      const { result } = await callVideo({
        respond: fakeSand({}),
        arguments: () => Promise.resolve({ [setting.name]: setting.default }),
      });
      expect(result.isError, setting.name).toBeFalsy();
    }
  });
});
