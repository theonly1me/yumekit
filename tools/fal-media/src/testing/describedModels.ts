import { z } from "zod";
import { connectFalMedia } from "./connectFalMedia.ts";
import { fakeFal } from "./fakeFal.ts";

const setting = z.discriminatedUnion("kind", [
  z.strictObject({
    name: z.string(),
    label: z.string(),
    kind: z.literal("choice"),
    choices: z.array(z.string()).min(1),
    default: z.string(),
  }),
  z.strictObject({
    name: z.string(),
    label: z.string(),
    kind: z.literal("whole-number"),
    minimum: z.int(),
    maximum: z.int(),
    default: z.int(),
  }),
  z.strictObject({
    name: z.string(),
    label: z.string(),
    kind: z.literal("switch"),
    default: z.boolean(),
  }),
  z.strictObject({
    name: z.string(),
    label: z.string(),
    kind: z.literal("image-file"),
  }),
  z.strictObject({
    name: z.string(),
    label: z.string(),
    kind: z.literal("image-files"),
    maximum: z.int().positive(),
  }),
]);

const describedModel = z.strictObject({
  id: z.string(),
  label: z.string(),
  capability: z.enum(["image", "video"]),
  is_default: z.boolean(),
  settings: z.array(setting),
  prices: z.array(
    z.strictObject({
      usd: z.number().nonnegative(),
      unit: z.enum(["second", "image"]),
      when: z.record(z.string(), z.string()),
    }),
  ),
  read_on: z.iso.date(),
  accepts: z.array(z.enum(["first_frame", "last_frame", "reference_images"])),
  tested: z.boolean(),
});

export const description = z.strictObject({
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
  models: z.array(describedModel),
});

export type DescribedModel = z.infer<typeof describedModel>;

export async function describeWithNoKey() {
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
