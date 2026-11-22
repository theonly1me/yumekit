export interface RequestedShape {
  widthPixels: number;
  heightPixels: number;
}

export const squareShape: RequestedShape = {
  widthPixels: 1024,
  heightPixels: 1024,
};

const narrowestRatio = 0.4;
const widestRatio = 2.5;
const sideMultiple = 32;

function ratioOf(shape: string): number {
  const [width, height] = shape.split(":").map(Number);
  if (width === undefined || height === undefined) {
    throw new Error(`The aspect ratio ${shape} is not written as width:height`);
  }
  return width / height;
}

export function nearestAspectRatio(
  options: RequestedShape & { ratios: readonly string[] },
): string {
  const wanted = Math.log(options.widthPixels / options.heightPixels);
  const distanceOf = (shape: string) =>
    Math.abs(Math.log(ratioOf(shape)) - wanted);
  const [first, ...others] = options.ratios;
  if (first === undefined) throw new Error("The model lists no aspect ratio");
  let nearest = first;
  for (const shape of others) {
    if (distanceOf(shape) < distanceOf(nearest)) nearest = shape;
  }
  return nearest;
}

export function sizeForArea(options: RequestedShape & { areaPixels: number }): {
  width: number;
  height: number;
} {
  const ratio = Math.min(
    widestRatio,
    Math.max(narrowestRatio, options.widthPixels / options.heightPixels),
  );
  const roundDown = (side: number) =>
    Math.floor(side / sideMultiple) * sideMultiple;
  return {
    width: roundDown(Math.sqrt(options.areaPixels * ratio)),
    height: roundDown(Math.sqrt(options.areaPixels / ratio)),
  };
}

export function falPage(endpointId: string): string {
  return `https://fal.ai/models/${endpointId}`;
}
