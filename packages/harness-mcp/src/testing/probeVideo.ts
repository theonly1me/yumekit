import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const runFile = promisify(execFile);

const probeSchema = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      codec_name: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      r_frame_rate: z.string(),
      nb_read_frames: z.string().optional(),
    }),
  ),
});

export async function probeVideo(file: string) {
  const { stdout } = await runFile("ffprobe", [
    "-v",
    "error",
    "-count_frames",
    "-show_entries",
    "stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames",
    "-of",
    "json",
    file,
  ]);
  return probeSchema.parse(JSON.parse(stdout)).streams;
}

export function pngSizeOf(base64: string): { width: number; height: number } {
  const bytes = Buffer.from(base64, "base64");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
