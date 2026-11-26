import {
  largestBestMegabytesOf,
  shortSideOf,
  smallerFilePlanOf,
  type PictureSize,
  type SmallerFilePlan,
} from "@yumekit/project/file-size";

export type FileSizeChoice =
  | { kind: "best" }
  | {
      kind: "smaller";
      largestMegabytes: number;
      ownText: string;
      shortSidePixels: number | undefined;
    };

export interface SizedVideo {
  seconds: number;
  size: PictureSize;
  framesPerSecond: number;
}

export const bestQuality: FileSizeChoice = { kind: "best" };

export function megabytesText(megabytes: number): string {
  const decimals = megabytes >= 100 ? 0 : megabytes >= 1 ? 1 : 2;
  const step = 10 ** decimals;
  const rounded = Math.max(1, Math.round(megabytes * step)) / step;
  return `${String(rounded)} MB`;
}

export function linesText(shortSidePixels: number): string {
  return `${String(shortSidePixels)}p`;
}

export function shortSideFor(options: {
  choice: FileSizeChoice;
  size: PictureSize;
}): number {
  const own = shortSideOf(options.size);
  const { choice } = options;
  return choice.kind === "smaller" && choice.shortSidePixels !== undefined
    ? Math.min(choice.shortSidePixels, own)
    : own;
}

export function planOf(options: {
  choice: Extract<FileSizeChoice, { kind: "smaller" }>;
  video: SizedVideo;
}): SmallerFilePlan {
  const { choice, video } = options;
  return smallerFilePlanOf({
    largestMegabytes: choice.largestMegabytes,
    seconds: video.seconds,
    shortSidePixels: shortSideFor({ choice, size: video.size }),
    hasAudio: true,
  });
}

export function expectedText(options: {
  choice: FileSizeChoice;
  video: SizedVideo;
}): string {
  const { choice, video } = options;
  const lines = linesText(shortSideFor({ choice, size: video.size }));
  if (choice.kind === "best") {
    return `Up to about ${megabytesText(largestBestMegabytesOf(video))}, ${lines}.`;
  }
  return `About ${megabytesText(planOf({ choice, video }).expectedMegabytes)}, ${lines}.`;
}

export function fileNameWithSize(options: {
  fileName: string;
  choice: FileSizeChoice;
}): string {
  const { choice } = options;
  if (choice.kind === "best") return options.fileName;
  return options.fileName.replace(
    /\.mp4$/,
    `-under-${String(choice.largestMegabytes)}mb.mp4`,
  );
}

export function renderInputOf(choice: FileSizeChoice): object {
  if (choice.kind === "best") return {};
  return {
    largest_megabytes: choice.largestMegabytes,
    ...(choice.shortSidePixels === undefined
      ? {}
      : { short_side_pixels: choice.shortSidePixels }),
  };
}
