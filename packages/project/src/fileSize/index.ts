export const bytesInMegabyte = 1_000_000;
export const smallerFileAudioKilobits = 128;
export const smallerFileShare = 0.94;
export const smallerFileTargetsMegabytes = [10, 25] as const;
export const offeredShortSides = [720, 480] as const;

const sharpKilobitsAt1080 = 700;
const sharpnessGrowth = 1.5;
const smallestVideoKilobits = 100;
const largestBestKilobitsAt1080p30 = 6500;
const pixelsAt1080p30 = 1920 * 1080 * 30;

export type SmallerFileLook = "sharp" | "soft" | "too-long" | "too-small";

export interface SmallerFilePlan {
  videoKilobits: number;
  expectedMegabytes: number;
  look: SmallerFileLook;
  offeredShortSide: number | undefined;
  smallestMegabytes: number;
}

export interface PictureSize {
  widthPixels: number;
  heightPixels: number;
}

export function sharpKilobitsOf(shortSidePixels: number): number {
  return Math.round(
    sharpKilobitsAt1080 * (shortSidePixels / 1080) ** sharpnessGrowth,
  );
}

function megabytesOf(options: { kilobits: number; seconds: number }): number {
  return (options.kilobits * 1000 * options.seconds) / 8 / bytesInMegabyte;
}

function roundedUp(megabytes: number): number {
  return Math.ceil(megabytes * 10) / 10;
}

export function videoKilobitsFor(options: {
  largestMegabytes: number;
  seconds: number;
  hasAudio: boolean;
}): number {
  const totalKilobits =
    (options.largestMegabytes * smallerFileShare * bytesInMegabyte * 8) /
    options.seconds /
    1000;
  const audio = options.hasAudio ? smallerFileAudioKilobits : 0;
  return Math.floor(totalKilobits - audio);
}

function lookOf(options: {
  videoKilobits: number;
  shortSidePixels: number;
}): Pick<SmallerFilePlan, "look" | "offeredShortSide"> {
  const { videoKilobits, shortSidePixels } = options;
  if (videoKilobits < smallestVideoKilobits) {
    return { look: "too-small", offeredShortSide: undefined };
  }
  if (videoKilobits >= sharpKilobitsOf(shortSidePixels)) {
    return { look: "sharp", offeredShortSide: undefined };
  }
  const offered = offeredShortSides.find(
    (side) => side < shortSidePixels && videoKilobits >= sharpKilobitsOf(side),
  );
  return offered === undefined
    ? { look: "too-long", offeredShortSide: undefined }
    : { look: "soft", offeredShortSide: offered };
}

export function smallerFilePlanOf(options: {
  largestMegabytes: number;
  seconds: number;
  shortSidePixels: number;
  hasAudio: boolean;
}): SmallerFilePlan {
  const videoKilobits = videoKilobitsFor(options);
  const audio = options.hasAudio ? smallerFileAudioKilobits : 0;
  return {
    videoKilobits,
    expectedMegabytes:
      Math.round(options.largestMegabytes * smallerFileShare * 100) / 100,
    ...lookOf({ videoKilobits, shortSidePixels: options.shortSidePixels }),
    smallestMegabytes: roundedUp(
      megabytesOf({
        kilobits: smallestVideoKilobits + audio,
        seconds: options.seconds,
      }) / smallerFileShare,
    ),
  };
}

export function largestBestMegabytesOf(options: {
  seconds: number;
  size: PictureSize;
  framesPerSecond: number;
}): number {
  const { size } = options;
  const pixelRate =
    size.widthPixels * size.heightPixels * options.framesPerSecond;
  return megabytesOf({
    kilobits: (largestBestKilobitsAt1080p30 * pixelRate) / pixelsAt1080p30,
    seconds: options.seconds,
  });
}

function evenOf(pixels: number): number {
  return Math.max(2, Math.round(pixels / 2) * 2);
}

export function shortSideOf(size: PictureSize): number {
  return Math.min(size.widthPixels, size.heightPixels);
}

export function sizeAtShortSide(options: {
  size: PictureSize;
  shortSidePixels: number;
}): PictureSize {
  const { size } = options;
  const scale = options.shortSidePixels / shortSideOf(size);
  if (scale >= 1) return size;
  return {
    widthPixels: evenOf(size.widthPixels * scale),
    heightPixels: evenOf(size.heightPixels * scale),
  };
}
