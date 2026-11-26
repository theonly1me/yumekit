import type { CSSProperties } from "react";

export function stageStyleOf(shape: number | undefined): CSSProperties {
  if (shape === undefined || !Number.isFinite(shape) || shape <= 0) {
    return {};
  }
  return {
    aspectRatio: String(shape),
    maxWidth: `calc(var(--stage-height) * ${String(shape)})`,
  };
}
