import type { AudioMix } from "./audioMix.js";
import { audioSampleRate } from "./audioMix.js";

const audioEncoding = [
  ["-c:a", "aac"],
  ["-b:a", "192k"],
  ["-ar", String(audioSampleRate)],
  ["-ac", "2"],
].flat();

const videoEncoding = [
  ["-c:v", "libx264"],
  ["-pix_fmt", "yuv420p"],
  ["-crf", "18"],
].flat();

export function ffmpegArgumentsOf(options: {
  framesPerSecond: number;
  frameCount: number;
  audioMix: AudioMix | undefined;
  destination: string;
}): string[] {
  const { audioMix } = options;
  const frameRate = String(options.framesPerSecond);
  const videoInput = [
    ["-f", "image2pipe"],
    ["-framerate", frameRate],
    ["-c:v", "png"],
    ["-i", "pipe:0"],
  ].flat();
  const video = [
    ["-map", "0:v"],
    ["-frames:v", String(options.frameCount)],
    videoEncoding,
    ["-r", frameRate],
  ].flat();
  const audioInputs =
    audioMix?.inputFiles.flatMap((file) => ["-i", file]) ?? [];
  const audio =
    audioMix === undefined
      ? []
      : [
          ["-filter_complex", audioMix.filterGraph],
          ["-map", audioMix.outputLabel],
          audioEncoding,
        ].flat();
  return [
    ["-hide_banner", "-loglevel", "error", "-y"],
    videoInput,
    audioInputs,
    video,
    audio,
    ["-movflags", "+faststart", options.destination],
  ].flat();
}
