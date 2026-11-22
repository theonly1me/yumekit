export const enterKinds = [
  "rise",
  "fade",
  "scale",
  "slide-left",
  "slide-right",
  "blur",
  "wipe",
  "pop",
] as const;

export type EnterKind = (typeof enterKinds)[number];

export interface MotionStyle {
  opacity: number;
  transform: string;
  filter?: string;
  clipPath?: string;
}

const settledStyle: MotionStyle = { opacity: 1, transform: "none" };
const blurUnits = 1.4;
const blurGrowth = 0.06;
const wipeOverhangPercent = 25;

export function styleOf(options: {
  kind: EnterKind;
  progress: number;
  opacity: number;
  distancePixels: number;
  unit: number;
}): MotionStyle {
  const { kind, progress, opacity, distancePixels, unit } = options;
  if (progress >= 1 && opacity >= 1) {
    return settledStyle;
  }
  const remaining = 1 - progress;
  switch (kind) {
    case "rise":
      return {
        opacity,
        transform: `translateY(${String(remaining * distancePixels)}px)`,
      };
    case "fade":
      return { opacity, transform: "none" };
    case "scale":
      return { opacity, transform: `scale(${String(0.86 + 0.14 * progress)})` };
    case "pop":
      return { opacity, transform: `scale(${String(0.4 + 0.6 * progress)})` };
    case "slide-left":
      return {
        opacity,
        transform: `translateX(${String(remaining * distancePixels)}px)`,
      };
    case "slide-right":
      return {
        opacity,
        transform: `translateX(${String(-remaining * distancePixels)}px)`,
      };
    case "blur":
      return {
        opacity,
        transform: `scale(${String(1 + remaining * blurGrowth)})`,
        filter: `blur(${String(remaining * blurUnits * unit)}px)`,
      };
    case "wipe": {
      const rightInset =
        remaining * (100 + wipeOverhangPercent) - wipeOverhangPercent;
      return {
        opacity: 1,
        transform: "none",
        clipPath: `inset(-${String(wipeOverhangPercent)}% ${String(rightInset)}% -${String(wipeOverhangPercent)}% -${String(wipeOverhangPercent)}%)`,
      };
    }
  }
}
