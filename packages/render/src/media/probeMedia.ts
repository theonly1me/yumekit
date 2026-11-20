import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { findFfmpeg } from "../video/findFfmpeg.js";

const runFile = promisify(execFile);

export interface ProbedMedia {
  kind: "image" | "audio" | "video";
  durationSeconds?: number;
  widthPixels?: number;
  heightPixels?: number;
  hasAudio?: boolean;
}

const probeSchema = z.object({
  format: z.object({
    format_name: z.string(),
    duration: z.coerce.number().optional(),
  }),
  streams: z.array(
    z.object({
      codec_type: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      disposition: z.object({ attached_pic: z.number() }).optional(),
    }),
  ),
});

type Probe = z.infer<typeof probeSchema>;

const singlePictureFormats = ["image2", "gif"];

function isSinglePictureFormat(formatName: string): boolean {
  return formatName
    .split(",")
    .some(
      (name) => singlePictureFormats.includes(name) || name.endsWith("_pipe"),
    );
}

function probedMediaOf(probe: Probe): ProbedMedia | undefined {
  const picture = probe.streams.find(
    (stream) =>
      stream.codec_type === "video" && stream.disposition?.attached_pic !== 1,
  );
  const hasAudio = probe.streams.some(
    (stream) => stream.codec_type === "audio",
  );
  const durationSeconds = probe.format.duration;
  const size =
    picture?.width === undefined || picture.height === undefined
      ? {}
      : { widthPixels: picture.width, heightPixels: picture.height };
  if (picture !== undefined && isSinglePictureFormat(probe.format.format_name))
    return { kind: "image", ...size };
  const length = durationSeconds === undefined ? {} : { durationSeconds };
  if (picture !== undefined)
    return { kind: "video", ...length, ...size, hasAudio };
  if (hasAudio) return { kind: "audio", ...length };
  return undefined;
}

async function readProbe(file: string): Promise<Probe | undefined> {
  try {
    const { stdout } = await runFile("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=format_name,duration:stream=codec_type,width,height:stream_disposition=attached_pic",
      "-of",
      "json",
      file,
    ]);
    const parsed = probeSchema.safeParse(JSON.parse(stdout));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function probeMedia(options: {
  file: string;
}): Promise<Outcome<ProbedMedia, RenderFailure>> {
  const missing = await findFfmpeg();
  if (missing !== undefined) return fail(missing);
  const probe = await readProbe(options.file);
  const probed = probe === undefined ? undefined : probedMediaOf(probe);
  if (probed !== undefined) return succeed(probed);
  return fail({
    kind: "media-not-readable",
    file: options.file,
    message: `ffprobe cannot read "${options.file}" as an image, audio, or video file.`,
    hint: "Check that the file exists and is a complete image, audio, or video file.",
  });
}
