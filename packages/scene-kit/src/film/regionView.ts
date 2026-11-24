import type { SceneRegion } from "@yumekit/scene";

export const wholePicture: SceneRegion = { x: 0, y: 0, width: 1, height: 1 };

const smallestBoxAspect = 0.5;
const largestBoxAspect = 4;

function clamp(options: { value: number; low: number; high: number }): number {
  return Math.min(options.high, Math.max(options.low, options.value));
}

export function regionAspect(options: {
  region: SceneRegion;
  pictureAspect: number;
}): number {
  const { region, pictureAspect } = options;
  return clamp({
    value: (region.width * pictureAspect) / region.height,
    low: smallestBoxAspect,
    high: largestBoxAspect,
  });
}

export function viewOf(options: {
  region: SceneRegion;
  boxAspect: number;
  pictureAspect: number;
}): SceneRegion {
  const { region, boxAspect, pictureAspect } = options;
  let width = region.width * pictureAspect;
  let height = region.height;
  if (width / height < boxAspect) width = height * boxAspect;
  else height = width / boxAspect;
  const shrink = Math.min(1, pictureAspect / width, 1 / height);
  width *= shrink;
  height *= shrink;
  const centerX = (region.x + region.width / 2) * pictureAspect;
  const centerY = region.y + region.height / 2;
  const left = clamp({
    value: centerX - width / 2,
    low: 0,
    high: pictureAspect - width,
  });
  const top = clamp({ value: centerY - height / 2, low: 0, high: 1 - height });
  return {
    x: left / pictureAspect,
    y: top,
    width: width / pictureAspect,
    height,
  };
}

export function blendRegions(options: {
  from: SceneRegion;
  to: SceneRegion;
  share: number;
}): SceneRegion {
  const { from, to, share } = options;
  const blend = (ends: { start: number; end: number }) =>
    ends.start + (ends.end - ends.start) * share;
  return {
    x: blend({ start: from.x, end: to.x }),
    y: blend({ start: from.y, end: to.y }),
    width: blend({ start: from.width, end: to.width }),
    height: blend({ start: from.height, end: to.height }),
  };
}

export function fitBox(options: {
  aspect: number;
  width: number;
  height: number;
}): { width: number; height: number } {
  const { aspect, width, height } = options;
  return width / height > aspect
    ? { width: height * aspect, height }
    : { width, height: width / aspect };
}
