import { z } from "zod";
import { runProgram } from "../sharpen/runProgram.ts";
import type { Outcome } from "../toolResults.ts";

const probeOutput = z.object({
  streams: z.array(z.object({ codec_type: z.string() })),
  format: z.object({ duration: z.string().optional() }),
});

export async function voiceSecondsOf(
  path: string,
): Promise<Outcome<number, string>> {
  const probed = await runProgram({
    program: "ffprobe",
    arguments: [
      ...["-v", "error", "-show_entries", "stream=codec_type:format=duration"],
      ...["-of", "json", path],
    ],
  });
  if (!probed.ok) {
    return { ok: false, failure: `audio_path ${path}: ${probed.failure}` };
  }
  const parsed = probeOutput.safeParse(JSON.parse(probed.value));
  const hasSound =
    parsed.success &&
    parsed.data.streams.some((stream) => stream.codec_type === "audio");
  const seconds = Number(parsed.success ? parsed.data.format.duration : "");
  if (!hasSound || !Number.isFinite(seconds) || seconds <= 0) {
    return {
      ok: false,
      failure: `audio_path ${path} has no sound that FFmpeg can read.`,
    };
  }
  return { ok: true, value: seconds };
}
