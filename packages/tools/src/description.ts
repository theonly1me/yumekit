import { z } from "zod";
import { capabilities } from "./convention.js";

const settingBase = { name: z.string().min(1), label: z.string().min(1) };

const mediaModelSettingSchema = z.discriminatedUnion("kind", [
  z.object({
    ...settingBase,
    kind: z.literal("choice"),
    choices: z.array(z.string()).min(1),
    default: z.string(),
  }),
  z.object({
    ...settingBase,
    kind: z.literal("whole-number"),
    minimum: z.int(),
    maximum: z.int(),
    default: z.int(),
  }),
  z.object({ ...settingBase, kind: z.literal("switch"), default: z.boolean() }),
  z.object({ ...settingBase, kind: z.literal("image-file") }),
  z.object({
    ...settingBase,
    kind: z.literal("image-files"),
    maximum: z.int().positive(),
  }),
]);

const mediaModelPriceSchema = z.object({
  usd: z.number().nonnegative(),
  unit: z.enum(["second", "image", "minute", "thousand-characters"]),
  when: z.record(z.string(), z.string()),
});

const dateText = z.iso.date();

const mediaModelInputs = [
  "first_frame",
  "last_frame",
  "reference_images",
] as const;

const mediaModelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  capability: z.enum(capabilities),
  is_default: z.boolean(),
  settings: z.array(mediaModelSettingSchema),
  prices: z.array(mediaModelPriceSchema),
  read_on: dateText,
  shutdown_on: dateText.optional(),
  accepts: z.array(z.enum(mediaModelInputs)).optional(),
  tested: z.boolean().optional(),
});

const mediaServerKeySchema = z.object({
  variable: z.string().min(1),
  label: z.string().min(1),
  get_key_url: z.url(),
  steps: z.array(z.string().min(1)),
});

function hasOneDefaultForEachCapability(
  models: z.infer<typeof mediaModelSchema>[],
): boolean {
  return capabilities.every((capability) => {
    const ofCapability = models.filter(
      (model) => model.capability === capability,
    );
    return (
      ofCapability.length === 0 ||
      ofCapability.filter((model) => model.is_default).length === 1
    );
  });
}

export const mediaServerDescriptionSchema = z.object({
  label: z.string().min(1),
  runs: z.enum(["hosted", "on-this-computer"]),
  keys: z.array(mediaServerKeySchema),
  models: z
    .array(mediaModelSchema)
    .refine(
      hasOneDefaultForEachCapability,
      "Exactly one model of each capability must have is_default",
    ),
});

export type MediaServerDescription = z.infer<
  typeof mediaServerDescriptionSchema
>;
export type MediaServerKey = MediaServerDescription["keys"][number];
export type MediaModel = MediaServerDescription["models"][number];
export type MediaModelSetting = MediaModel["settings"][number];
export type MediaModelPrice = MediaModel["prices"][number];
