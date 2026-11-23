import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { modelInput, unknownModelMessage } from "../catalog.ts";
import { mediaFactsOf, type MediaFacts } from "../sharpen/mediaFacts.ts";
import { runProgram } from "../sharpen/runProgram.ts";
import {
  errorResult,
  prepareOutputPath,
  successResult,
} from "../toolResults.ts";
import { voiceSecondsOf } from "./voiceSeconds.ts";

const framesPerSecond = 24;

const talkingClipInput = {
  model: modelInput("talking-clip"),
  media_path: z
    .string()
    .min(1)
    .describe(
      "A PNG, JPEG, or WebP picture, or an MP4, MOV, or WebM video of the person",
    ),
  audio_path: z
    .string()
    .min(1)
    .describe("The voice file. The clip is as long as the voice"),
  prompt: z
    .string()
    .optional()
    .describe("How the person moves. The sample server ignores it"),
  output_directory: z.string().min(1).describe("Folder for the new file"),
  file_stem: z.string().min(1).describe("Start of the new file name"),
};

function evenSide(pixels: number): number {
  return Math.max(2, Math.floor(pixels / 2) * 2);
}

function talkingArguments(options: {
  facts: MediaFacts;
  mediaPath: string;
  audioPath: string;
  seconds: number;
  outputPath: string;
}): string[] {
  const { facts } = options;
  const repeat =
    facts.kind === "image" ? ["-loop", "1"] : ["-stream_loop", "-1"];
  const size = `scale=${String(evenSide(facts.widthPixels))}:${String(evenSide(facts.heightPixels))},fps=${String(framesPerSecond)}`;
  return [
    ...["-v", "error", "-y", ...repeat, "-i", options.mediaPath],
    ...["-i", options.audioPath, "-map", "0:v:0", "-map", "1:a:0"],
    ...["-t", String(options.seconds), "-vf", size],
    ...["-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p"],
    ...["-c:a", "aac", "-movflags", "+faststart", options.outputPath],
  ];
}

export function registerTalkingClipTool(server: McpServer): void {
  server.registerTool(
    "generate_talking_clip",
    {
      description:
        "Test tool, free, no model. Writes an MP4 of the picture, or of the video in a loop, with the voice file as its sound, as long as the voice. The lips do not move. Needs FFmpeg on the PATH.",
      inputSchema: talkingClipInput,
    },
    async (input) => {
      const modelFailure = unknownModelMessage({
        capability: "talking-clip",
        model: input.model,
      });
      if (modelFailure) return errorResult(modelFailure);
      const facts = await mediaFactsOf(input.media_path);
      if (!facts.ok) return errorResult(facts.failure);
      const seconds = await voiceSecondsOf(input.audio_path);
      if (!seconds.ok) return errorResult(seconds.failure);
      const prepared = await prepareOutputPath({
        outputDirectory: input.output_directory,
        fileStem: input.file_stem,
        extension: "mp4",
      });
      if (!prepared.ok) return errorResult(prepared.failure);
      const made = await runProgram({
        program: "ffmpeg",
        arguments: talkingArguments({
          facts: facts.value,
          mediaPath: input.media_path,
          audioPath: input.audio_path,
          seconds: seconds.value,
          outputPath: prepared.value,
        }),
      });
      if (!made.ok) return errorResult(made.failure);
      return successResult({
        files: [
          {
            path: prepared.value,
            kind: "video",
            width_pixels: evenSide(facts.value.widthPixels),
            height_pixels: evenSide(facts.value.heightPixels),
            duration_seconds: seconds.value,
          },
        ],
      });
    },
  );
}
