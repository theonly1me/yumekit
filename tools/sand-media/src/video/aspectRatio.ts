import { videoModel } from "./videoModel.ts";

function ratioOf(shape: string): number {
  const [width, height] = shape.split(":").map(Number);
  if (width === undefined || height === undefined) {
    throw new Error(`The aspect ratio ${shape} is not written as width:height`);
  }
  return width / height;
}

export function nearestAspectRatio(options: {
  widthPixels: number;
  heightPixels: number;
}): string {
  const wanted = Math.log(options.widthPixels / options.heightPixels);
  const distanceOf = (shape: string) =>
    Math.abs(Math.log(ratioOf(shape)) - wanted);
  const [first, ...others] = videoModel.aspectRatios;
  let nearest: string = first;
  for (const shape of others) {
    if (distanceOf(shape) < distanceOf(nearest)) nearest = shape;
  }
  return nearest;
}
