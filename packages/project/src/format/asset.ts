import { posix } from "node:path";
import { z } from "zod";
import { assetMarksSchema } from "./assetMarks.js";
import { frameCountSchema, idSchema, jsonObjectSchema } from "./values.js";

const assetFilesFolder = "assets/files/";

function isPathInsideAssetFiles(file: string): boolean {
  return (
    file.startsWith(assetFilesFolder) &&
    file.length > assetFilesFolder.length &&
    !file.includes("\\") &&
    posix.normalize(file) === file
  );
}

export const assetSourceSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("import"), originalName: z.string() }),
  z.strictObject({
    kind: z.literal("tool"),
    server: z.string(),
    tool: z.string(),
    model: z.string().exactOptional(),
    input: jsonObjectSchema,
    costUsd: z.number().min(0).exactOptional(),
    costIsEstimate: z.boolean().exactOptional(),
    fit: z
      .strictObject({
        originalFile: z
          .string()
          .refine(
            isPathInsideAssetFiles,
            `must be a path inside ${assetFilesFolder}`,
          ),
        seconds: z.number().positive(),
        fadeOutSeconds: z.number().min(0),
      })
      .exactOptional(),
  }),
]);

export const assetSchema = z.strictObject({
  id: idSchema,
  kind: z.enum(["image", "audio", "video", "font"]),
  file: z
    .string()
    .refine(
      isPathInsideAssetFiles,
      `must be a path inside ${assetFilesFolder}`,
    ),
  contentHash: z.string(),
  widthPixels: z.int().min(1).exactOptional(),
  heightPixels: z.int().min(1).exactOptional(),
  durationFrames: frameCountSchema.exactOptional(),
  hasAudio: z.boolean().exactOptional(),
  hasWords: z.boolean(),
  label: z.string().max(200).exactOptional(),
  marks: assetMarksSchema.exactOptional(),
  source: assetSourceSchema,
});

export const assetIndexSchema = z.strictObject({
  assets: z.array(assetSchema),
});

export const wordTimingsSchema = z.strictObject({
  words: z.array(
    z.strictObject({
      text: z.string(),
      startFrame: frameCountSchema,
      endFrame: frameCountSchema,
    }),
  ),
});

export function wordsFileOfAsset(assetId: string): string {
  return `${assetFilesFolder}${assetId}.words.json`;
}

export type AssetSource = z.infer<typeof assetSourceSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type AssetIndex = z.infer<typeof assetIndexSchema>;
export type WordTimings = z.infer<typeof wordTimingsSchema>;
