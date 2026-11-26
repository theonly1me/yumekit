import { takeSchema } from "@yumekit/project/takes";
import { z } from "zod";
import { castEntrySchema } from "../cast/castEntries.js";
import { storyPlanSchema } from "../parts/story/storyPlanSchema.js";
import { wholeStorySchema } from "../parts/story/wholeStorySchema.js";
import { checkModeIds } from "../settings/checkModes.js";
import { videoStyleIds } from "../videoStyle/videoStyles.js";

const outputSchema = z.object({
  id: z.string(),
  label: z.string(),
  widthPixels: z.number(),
  heightPixels: z.number(),
  platforms: z.array(z.string()).optional(),
});

const propsSchema = z.record(z.string(), z.json());

const sceneSourceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("kit"),
    component: z.string(),
    props: propsSchema,
  }),
  z.object({ kind: z.literal("module"), props: propsSchema }),
]);

const sceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string(),
  source: sceneSourceSchema,
});

export const transitionKinds = ["fade", "slide", "wipe", "zoom"] as const;

const sceneClipSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  startFrame: z.number(),
  durationFrames: z.number(),
  sceneStartFrame: z.number(),
  transition: z
    .object({ kind: z.enum(transitionKinds), durationFrames: z.number() })
    .optional(),
});

const audioClipSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  startFrame: z.number(),
  durationFrames: z.number(),
  assetStartFrame: z.number(),
  gainDecibels: z.number(),
});

const trackSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string(),
    kind: z.literal("scene"),
    clips: z.array(sceneClipSchema),
    off: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("audio"),
    clips: z.array(audioClipSchema),
    off: z.boolean().optional(),
  }),
]);

const timelineSchema = z.object({
  outputId: z.string(),
  tracks: z.array(trackSchema),
});

const assetSchema = z.object({
  id: z.string(),
  kind: z.enum(["image", "audio", "video", "font"]),
  hasWords: z.boolean(),
  contentHash: z.string().optional(),
  label: z.string().optional(),
  widthPixels: z.number().optional(),
  heightPixels: z.number().optional(),
  durationFrames: z.number().optional(),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("import"), originalName: z.string() }),
    z.object({
      kind: z.literal("tool"),
      server: z.string().optional(),
      model: z.string().optional(),
      tool: z.string(),
      input: z.record(z.string(), z.json()),
      costUsd: z.number().optional(),
    }),
  ]),
});

export const snapshotSchema = z.object({
  revision: z.number(),
  project: z.object({
    name: z.string(),
    framesPerSecond: z.number(),
    outputs: z.array(outputSchema),
    videoStyle: z.enum(videoStyleIds).optional(),
    look: z.string().optional(),
    calm: z.boolean().optional(),
    approvePicturesFirst: z.boolean().optional(),
    checks: z.enum(checkModeIds).optional(),
    tempo: z.number().optional(),
    fonts: z
      .array(
        z.object({
          assetId: z.string(),
          family: z.string(),
          weight: z
            .union([z.number(), z.tuple([z.number(), z.number()])])
            .optional(),
          style: z.enum(["normal", "italic"]).optional(),
        }),
      )
      .optional(),
    lookFont: z.string().optional(),
  }),
  bible: z.object({
    cast: z.array(castEntrySchema),
    story: wholeStorySchema.optional(),
    storyPlan: storyPlanSchema.optional(),
  }),
  script: z.string(),
  scenes: z.array(sceneSchema),
  sceneCode: z.record(z.string(), z.string()),
  timelines: z.array(timelineSchema),
  assets: z.array(assetSchema),
  takes: z.array(takeSchema).optional(),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
export type Output = z.infer<typeof outputSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Track = z.infer<typeof trackSchema>;
export type SceneClip = z.infer<typeof sceneClipSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type SceneProps = z.infer<typeof propsSchema>;
export type Timeline = z.infer<typeof timelineSchema>;

export const healthSchema = z.object({
  projectFolder: z.string(),
  version: z.string(),
});

export const previewSchema = z.object({ pageUrl: z.string() });

export const toolResultSchema = z.object({
  isError: z.boolean(),
  text: z.string(),
  data: z.record(z.string(), z.json()),
  images: z.array(z.object({ mimeType: z.string(), base64: z.string() })),
});

export const uploadSchema = z.object({ asset: assetSchema });

export type ToolResult = z.infer<typeof toolResultSchema>;
