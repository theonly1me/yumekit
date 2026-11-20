import { z } from "zod";
import { assetSchema, wordTimingsSchema } from "../format/asset.js";
import { bibleSchema } from "../format/bible.js";
import { outputSchema } from "../format/project.js";
import { sceneSchema } from "../format/scene.js";
import {
  audioClipSchema,
  sceneClipSchema,
  timelineSchema,
} from "../format/timeline.js";
import {
  durationFramesSchema,
  frameCountSchema,
  idSchema,
} from "../format/values.js";

export const assetInputSchema = assetSchema.omit({
  contentHash: true,
  hasWords: true,
});

export const clipChangesSchema = z.strictObject({
  startFrame: frameCountSchema.exactOptional(),
  durationFrames: durationFramesSchema.exactOptional(),
  sceneStartFrame: frameCountSchema.exactOptional(),
  assetStartFrame: frameCountSchema.exactOptional(),
  gainDecibels: z.number().exactOptional(),
});

export const editSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("setProjectName"), name: z.string() }),
  z.strictObject({ kind: z.literal("addOutput"), output: outputSchema }),
  z.strictObject({ kind: z.literal("removeOutput"), outputId: idSchema }),
  z.strictObject({ kind: z.literal("setScript"), script: z.string() }),
  z.strictObject({ kind: z.literal("setBible"), bible: bibleSchema }),
  z.strictObject({
    kind: z.literal("putScene"),
    scene: sceneSchema,
    code: z.string().exactOptional(),
  }),
  z.strictObject({ kind: z.literal("removeScene"), sceneId: idSchema }),
  z.strictObject({
    kind: z.literal("addAsset"),
    asset: assetInputSchema,
    words: wordTimingsSchema.exactOptional(),
  }),
  z.strictObject({ kind: z.literal("removeAsset"), assetId: idSchema }),
  z.strictObject({ kind: z.literal("setTimeline"), timeline: timelineSchema }),
  z.strictObject({
    kind: z.literal("addClip"),
    outputId: idSchema,
    trackId: idSchema,
    clip: z.union([sceneClipSchema, audioClipSchema]),
  }),
  z.strictObject({
    kind: z.literal("updateClip"),
    outputId: idSchema,
    clipId: idSchema,
    changes: clipChangesSchema,
  }),
  z.strictObject({
    kind: z.literal("removeClip"),
    outputId: idSchema,
    clipId: idSchema,
  }),
  z.strictObject({
    kind: z.literal("copyTimeline"),
    fromOutputId: idSchema,
    toOutputId: idSchema,
  }),
]);

export type Edit = z.infer<typeof editSchema>;

export type EditOfKind<Kind extends Edit["kind"]> = Extract<
  Edit,
  { kind: Kind }
>;

export type ClipChanges = z.infer<typeof clipChangesSchema>;
