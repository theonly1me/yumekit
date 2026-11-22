import { z } from "zod";
import { durationFramesSchema, frameCountSchema, idSchema } from "./values.js";

export const transitionKinds = ["fade", "slide", "wipe", "zoom"] as const;

export const sceneTransitionSchema = z.strictObject({
  kind: z.enum(transitionKinds),
  durationFrames: durationFramesSchema,
});

export const sceneClipSchema = z.strictObject({
  id: idSchema,
  sceneId: idSchema,
  startFrame: frameCountSchema,
  durationFrames: durationFramesSchema,
  sceneStartFrame: frameCountSchema,
  transition: sceneTransitionSchema.exactOptional(),
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

export type SceneTransition = z.infer<typeof sceneTransitionSchema>;
export type TransitionKind = SceneTransition["kind"];
export type SceneClip = z.infer<typeof sceneClipSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
