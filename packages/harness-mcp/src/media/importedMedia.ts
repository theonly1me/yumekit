import { probeMedia } from "@yumekit/render";
import { renderFailureOf } from "../output/renderFailures.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { framesOfSeconds } from "./assetFiles.js";

export type ImportKind = "image" | "font" | "audio" | "video";

export const extensionsByKind = {
  image: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
  font: [".woff2", ".woff", ".ttf", ".otf"],
  audio: [".wav", ".mp3", ".m4a", ".aac", ".ogg", ".flac"],
  video: [".mp4", ".mov", ".webm", ".mkv"],
} as const;

const extensionsWithoutProbe: readonly string[] = [
  ...extensionsByKind.font,
  ".svg",
];

export interface ImportedMedia {
  widthPixels?: number;
  heightPixels?: number;
  durationFrames?: number;
}

export async function importedMediaOf(options: {
  file: string;
  extension: string;
  kind: ImportKind;
  framesPerSecond: number;
}): Promise<Outcome<ImportedMedia, HarnessFailure>> {
  const { kind } = options;
  if (extensionsWithoutProbe.includes(options.extension)) {
    return { ok: true, value: {} };
  }
  const probed = await probeMedia({ file: options.file });
  if (!probed.ok)
    return { ok: false, failure: renderFailureOf(probed.failure) };
  const media = probed.value;
  if (media.kind !== kind) {
    return {
      ok: false,
      failure: {
        kind: "file-type-not-supported",
        message: `The file is ${media.kind}, not ${kind}.`,
        hint: `Call import_asset again with kind "${media.kind}".`,
      },
    };
  }
  return {
    ok: true,
    value: {
      ...(media.widthPixels === undefined
        ? {}
        : { widthPixels: media.widthPixels }),
      ...(media.heightPixels === undefined
        ? {}
        : { heightPixels: media.heightPixels }),
      ...(media.durationSeconds === undefined || kind === "image"
        ? {}
        : {
            durationFrames: framesOfSeconds({
              seconds: media.durationSeconds,
              framesPerSecond: options.framesPerSecond,
            }),
          }),
    },
  };
}
