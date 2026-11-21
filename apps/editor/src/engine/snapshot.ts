import { z } from "zod";

const outputSchema = z.object({
  id: z.string(),
  label: z.string(),
  widthPixels: z.number(),
  heightPixels: z.number(),
});

const sceneSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("kit"), component: z.string() }),
  z.object({ kind: z.literal("module") }),
]);

const sceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: sceneSourceSchema,
});

const sceneClipSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  startFrame: z.number(),
  durationFrames: z.number(),
  sceneStartFrame: z.number(),
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
  }),
  z.object({
    id: z.string(),
    kind: z.literal("audio"),
    clips: z.array(audioClipSchema),
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
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("import"), originalName: z.string() }),
    z.object({
      kind: z.literal("tool"),
      input: z.record(z.string(), z.json()),
    }),
  ]),
});

export const snapshotSchema = z.object({
  revision: z.number(),
  project: z.object({
    name: z.string(),
    framesPerSecond: z.number(),
    outputs: z.array(outputSchema),
  }),
  scenes: z.array(sceneSchema),
  timelines: z.array(timelineSchema),
  assets: z.array(assetSchema),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
export type Output = z.infer<typeof outputSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Track = z.infer<typeof trackSchema>;
export type SceneClip = z.infer<typeof sceneClipSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type Asset = z.infer<typeof assetSchema>;
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

export type ToolResult = z.infer<typeof toolResultSchema>;
