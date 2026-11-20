import { isAbsolute } from "node:path";
import { z } from "zod";
import type { Capability } from "./types.js";

export const toolNameByCapability = {
  image: "generate_image",
  speech: "generate_speech",
  align: "align_words",
  music: "generate_music",
  video: "generate_video",
} as const satisfies Record<Capability, string>;

export const capabilities = [
  "image",
  "speech",
  "align",
  "music",
  "video",
] as const satisfies readonly Capability[];

export function capabilitiesOfTools(toolNames: string[]): Capability[] {
  return capabilities.filter((capability) =>
    toolNames.includes(toolNameByCapability[capability]),
  );
}

export function writesFiles(capability: Capability): boolean {
  return capability !== "align";
}

const seconds = z.number().nonnegative();
const pixels = z.number().int().positive();

export const mediaToolResultSchema = z.object({
  files: z.array(
    z.object({
      path: z
        .string()
        .refine((path) => isAbsolute(path), "path must be absolute"),
      kind: z.enum(["image", "audio", "video"]),
      width_pixels: pixels.optional(),
      height_pixels: pixels.optional(),
      duration_seconds: seconds.optional(),
    }),
  ),
  words: z
    .array(
      z.object({
        text: z.string(),
        start_seconds: seconds,
        end_seconds: seconds,
      }),
    )
    .optional(),
  cost_usd: z.number().nonnegative().optional(),
});

export type MediaToolResult = z.infer<typeof mediaToolResultSchema>;
