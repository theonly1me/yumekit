import type { PointerEvent } from "react";

export interface LaneScale {
  lane: HTMLElement | null;
  lengthFrames: number;
  framesPerSecond: number;
}

export function dragBySeconds(options: {
  down: PointerEvent<HTMLElement>;
  scale: LaneScale;
  onMove: (deltaFrames: number) => void;
  onEnd: (deltaFrames: number) => void;
}): void {
  const { down, scale } = options;
  const width = scale.lane?.getBoundingClientRect().width ?? 0;
  if (down.button !== 0 || width === 0) return;
  down.preventDefault();
  down.stopPropagation();
  const target = down.currentTarget;
  target.setPointerCapture(down.pointerId);
  const framesPerPixel = scale.lengthFrames / width;
  let delta = 0;
  const move = (event: globalThis.PointerEvent) => {
    const frames = (event.clientX - down.clientX) * framesPerPixel;
    delta = Math.round(frames / scale.framesPerSecond) * scale.framesPerSecond;
    options.onMove(delta);
  };
  const end = () => {
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", end);
    target.removeEventListener("pointercancel", end);
    options.onEnd(delta);
  };
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", end);
  target.addEventListener("pointercancel", end);
}

export function secondsStepOf(key: string): number | undefined {
  if (key === "ArrowLeft") return -1;
  if (key === "ArrowRight") return 1;
  return undefined;
}

export function laneStyleOf(options: {
  startFrame: number;
  durationFrames: number;
  lengthFrames: number;
}) {
  const { startFrame, durationFrames, lengthFrames } = options;
  return {
    left: `${String((startFrame / lengthFrames) * 100)}%`,
    width: `calc(${String((durationFrames / lengthFrames) * 100)}% - 2px)`,
  };
}
