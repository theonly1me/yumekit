import { z } from "zod";
import { durationFramesSchema, frameCountSchema, idSchema } from "./values.js";

export const sceneClipSchema = z.strictObject({
  id: idSchema,
  sceneId: idSchema,
  startFrame: frameCountSchema,
  durationFrames: durationFramesSchema,
  sceneStartFrame: frameCountSchema,
});

export const audioClipSchema = z.strictObject({
  id: idSchema,
  assetId: idSchema,
  startFrame: frameCountSchema,
  durationFrames: durationFramesSchema,
  assetStartFrame: frameCountSchema,
  gainDecibels: z.number(),
});

export const trackSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    id: idSchema,
    kind: z.literal("scene"),
    clips: z.array(sceneClipSchema),
    off: z.boolean().exactOptional(),
  }),
  z.strictObject({
    id: idSchema,
    kind: z.literal("audio"),
    clips: z.array(audioClipSchema),
    off: z.boolean().exactOptional(),
  }),
]);

export const timelineSchema = z.strictObject({
  outputId: idSchema,
  tracks: z.array(trackSchema),
});

export type SceneClip = z.infer<typeof sceneClipSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
