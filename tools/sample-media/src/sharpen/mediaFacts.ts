import { extname } from "node:path";
import { z } from "zod";
import type { Outcome } from "../toolResults.ts";
import { runProgram } from "./runProgram.ts";

export type SharpenKind = "image" | "video";

export interface MediaFacts {
  kind: SharpenKind;
  widthPixels: number;
  heightPixels: number;
  hasAudio: boolean;
}

const kindByExtension: Partial<Record<string, SharpenKind>> = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".mp4": "video",
  ".mov": "video",
  ".webm": "video",
};

const probeOutput = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      width: z.int().positive().optional(),
      height: z.int().positive().optional(),
    }),
  ),
});

export async function mediaFactsOf(
  path: string,
): Promise<Outcome<MediaFacts, string>> {
  const kind = kindByExtension[extname(path).toLowerCase()];
  if (kind === undefined) {
    return {
      ok: false,
      failure: `media_path ${path} is not a PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video.`,
    };
  }
  const probed = await runProgram({
    program: "ffprobe",
    arguments: [
      ...["-v", "error", "-show_entries", "stream=codec_type,width,height"],
      ...["-of", "json", path],
    ],
  });
  if (!probed.ok) return probed;
  const parsed = probeOutput.safeParse(JSON.parse(probed.value));
  const streams = parsed.success ? parsed.data.streams : [];
  const picture = streams.find((stream) => stream.codec_type === "video");
  if (picture?.width === undefined || picture.height === undefined) {
    return { ok: false, failure: `ffprobe found no picture in ${path}.` };
  }
  return {
    ok: true,
    value: {
      kind,
      widthPixels: picture.width,
      heightPixels: picture.height,
      hasAudio: streams.some((stream) => stream.codec_type === "audio"),
    },
  };
}
