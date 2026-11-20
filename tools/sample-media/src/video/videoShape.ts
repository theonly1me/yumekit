export const videoFramesPerSecond = 24;

const longSidePixels = 1280;
const shortSidePixels = 720;

export function videoSizeOf(request: {
  widthPixels: number | undefined;
  heightPixels: number | undefined;
}): { width: number; height: number } {
  const { widthPixels, heightPixels } = request;
  const isTall =
    widthPixels !== undefined &&
    heightPixels !== undefined &&
    heightPixels > widthPixels;
  return isTall
    ? { width: shortSidePixels, height: longSidePixels }
    : { width: longSidePixels, height: shortSidePixels };
}

export function frameCountOf(durationSeconds: number): number {
  return Math.max(1, Math.round(durationSeconds * videoFramesPerSecond));
}
