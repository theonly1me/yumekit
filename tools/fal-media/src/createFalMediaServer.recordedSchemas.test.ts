import { describe, expect, it } from "vitest";
import { falPage } from "./catalog/shapes.ts";
import { imageModels } from "./catalog/image/index.ts";
import { videoModels } from "./catalog/video/index.ts";
import {
  bodyOf,
  connectFalMedia,
  placeholderKey,
  resultText,
  temporaryFolder,
  writeImage,
} from "./testing/connectFalMedia.ts";
import {
  describeWithNoKey,
  type DescribedModel,
} from "./testing/describedModels.ts";
import { fakeFal } from "./testing/fakeFal.ts";
import {
  readRecordedSchema,
  schemaProblems,
} from "./testing/recordedSchema.ts";

interface Call {
  name: string;
  input: Record<string, unknown>;
}

async function callsOf(model: DescribedModel): Promise<Call[]> {
  const folder = await temporaryFolder();
  const image = (name: string) => writeImage({ folder, name });
  const firstFrame = await image("first.png");
  const lastFrame = await image("last.png");
  const references = [await image("one.png"), await image("two.png")];
  const durationSetting = model.settings.find(
    (entry) => entry.name === "duration_seconds",
  );
  const base =
    model.capability === "video"
      ? {
          duration_seconds:
            durationSetting?.kind === "whole-number"
              ? durationSetting.default
              : 5,
        }
      : {};
  const fileInputs: Partial<Record<string, Record<string, unknown>>> = {
    first_frame_path: { first_frame_path: firstFrame },
    last_frame_path: {
      first_frame_path: firstFrame,
      last_frame_path: lastFrame,
    },
    reference_image_paths: { reference_image_paths: references },
  };
  const calls: Call[] = [{ name: "no setting", input: base }];
  for (const setting of model.settings) {
    const value =
      setting.kind === "image-file" || setting.kind === "image-files"
        ? fileInputs[setting.name]
        : { [setting.name]: setting.default };
    calls.push({ name: setting.name, input: { ...base, ...value } });
    if (setting.kind === "switch") {
      calls.push({
        name: `${setting.name} turned`,
        input: { ...base, [setting.name]: !setting.default },
      });
    }
  }
  return calls.map((call) => ({
    ...call,
    input: {
      prompt: "A red fox in snow",
      output_directory: folder,
      file_stem: "check",
      model: model.id,
      ...call.input,
    },
  }));
}

const toolOf = { image: "generate_image", video: "generate_video" } as const;

describe("each catalog model sends a body that matches the schema of its fal page", async () => {
  const { parsed } = await describeWithNoKey();

  it.each(parsed.models.map((model) => ({ id: model.id, model })))(
    "$id",
    async ({ model }) => {
      const catalogEntry = [...imageModels, ...videoModels].find(
        (entry) => entry.id === model.id,
      );
      for (const call of await callsOf(model)) {
        const media = await connectFalMedia({
          environment: { FAL_KEY: placeholderKey },
          respond: fakeFal({}),
        });
        const result = await media.callTool({
          name: toolOf[model.capability],
          arguments: call.input,
        });
        expect(
          result.isError,
          `${call.name}: ${resultText(result)}`,
        ).toBeFalsy();
        const [submit] = media.requests.filter(
          (request) =>
            new URL(request.url).hostname === "queue.fal.run" &&
            request.method === "POST",
        );
        if (submit === undefined)
          throw new Error(`${call.name} sent no request`);
        const endpointId = new URL(submit.url).pathname.slice(1);
        const schema = await readRecordedSchema(endpointId);
        const body = await bodyOf(submit);
        if (typeof body !== "object" || body === null) {
          throw new Error(`${call.name} sent a body that is not an object`);
        }
        expect(
          schemaProblems({ schema, body: { ...body } }),
          `${call.name} to ${endpointId}`,
        ).toEqual([]);
        expect(catalogEntry?.sources, `${model.id} names its page`).toContain(
          falPage(endpointId),
        );
        expect(schema.page).toBe(falPage(endpointId));
      }
    },
  );
});
