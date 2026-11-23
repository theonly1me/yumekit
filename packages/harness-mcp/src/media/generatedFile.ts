import type { MediaToolResult } from "@yumekit/tools";
import { probeMedia } from "@yumekit/render";
import { renderFailureOf } from "../output/renderFailures.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { framesOfSeconds } from "./assetFiles.js";

type ResultFile = MediaToolResult["files"][number];

export interface GeneratedMedia {
  widthPixels?: number;
  heightPixels?: number;
  durationFrames?: number;
  hasAudio?: boolean;
}

function reportedMediaOf(options: {
  file: ResultFile;
  framesPerSecond: number;
}): GeneratedMedia {
  const { file, framesPerSecond } = options;
  return {
    ...(file.width_pixels === undefined
      ? {}
      : { widthPixels: file.width_pixels }),
    ...(file.height_pixels === undefined
      ? {}
      : { heightPixels: file.height_pixels }),
    ...(file.duration_seconds === undefined
      ? {}
      : {
          durationFrames: framesOfSeconds({
            seconds: file.duration_seconds,
            framesPerSecond,
          }),
        }),
  };
}

async function audioWithProbedLength(options: {
  file: ResultFile;
  framesPerSecond: number;
}): Promise<Outcome<GeneratedMedia, HarnessFailure>> {
  const probed = await probeMedia({ file: options.file.path });
  const seconds = probed.ok ? probed.value.durationSeconds : undefined;
  return {
    ok: true,
    value:
      seconds === undefined
        ? {}
        : {
            durationFrames: framesOfSeconds({
              seconds,
              framesPerSecond: options.framesPerSecond,
            }),
          },
  };
}

export async function generatedMediaOf(options: {
  file: ResultFile;
  server: string;
  framesPerSecond: number;
}): Promise<Outcome<GeneratedMedia, HarnessFailure>> {
  const { file, framesPerSecond } = options;
  const reported = reportedMediaOf({ file, framesPerSecond });
  if (file.kind === "image") return { ok: true, value: reported };
  if (file.kind === "audio") {
    return reported.durationFrames === undefined
      ? audioWithProbedLength({ file, framesPerSecond })
      : { ok: true, value: reported };
  }
  const probed = await probeMedia({ file: file.path });
  if (!probed.ok) {
    if (probed.failure.kind !== "media-not-readable") {
      return { ok: false, failure: renderFailureOf(probed.failure) };
    }
    return {
      ok: false,
      failure: {
        kind: "media-tool-invalid-result",
        message: `The media server "${options.server}" returned a video file that ffprobe cannot read: ${file.path}`,
        hint: "Call again, or use another server from list_media_tools, and tell the user.",
      },
    };
  }
  const media = probed.value;
  return {
    ok: true,
    value: {
      ...(media.widthPixels === undefined
        ? {}
        : { widthPixels: media.widthPixels }),
      ...(media.heightPixels === undefined
        ? {}
        : { heightPixels: media.heightPixels }),
      ...(media.durationSeconds === undefined
        ? {}
        : {
            durationFrames: framesOfSeconds({
              seconds: media.durationSeconds,
              framesPerSecond,
            }),
          }),
      ...reported,
      hasAudio: media.hasAudio ?? false,
    },
  };
}
