import { useFrame, useSceneContext } from "@yumekit/scene";
import type { ReactNode } from "react";
import type { StylePack } from "../stylePacks/stylePack.js";
import { PaintedCanvas } from "./PaintedCanvas.js";

const horizonShare = 0.46;
const depthLineCount = 14;
const sideLineCount = 9;
const linesPerSecond = 0.55;
const sideSpreadShare = 0.24;
const lineOpacity = 0.75;
const horizonGlowOpacity = 0.35;
const horizonFadeShare = 0.12;

function paintGrid(options: {
  context: CanvasRenderingContext2D;
  stylePack: StylePack;
  phase: number;
  unit: number;
}) {
  const { context, stylePack, phase, unit } = options;
  const { width, height } = context.canvas;
  const horizonY = height * horizonShare;
  const floorHeight = height - horizonY;
  const [lineColor, horizonColor] = stylePack.colors.glow;
  context.save();
  context.globalAlpha = horizonGlowOpacity;
  context.translate(width / 2, horizonY);
  context.scale(1, (0.3 * height) / (0.7 * width));
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, 0.7 * width);
  glow.addColorStop(0, horizonColor);
  glow.addColorStop(1, `rgb(from ${horizonColor} r g b / 0)`);
  context.fillStyle = glow;
  context.fillRect(-width, -height, 2 * width, 2 * height);
  context.restore();
  context.globalAlpha = lineOpacity;
  context.strokeStyle = lineColor;
  context.lineWidth = Math.max(1, unit * 0.2);
  context.beginPath();
  for (let index = 0; index < depthLineCount; index += 1) {
    const y = horizonY + floorHeight / Math.max(index + 1 - phase, 0.001);
    if (y <= height) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
  }
  for (let offset = -sideLineCount; offset <= sideLineCount; offset += 1) {
    context.moveTo(width / 2, horizonY);
    context.lineTo(width / 2 + offset * width * sideSpreadShare, height);
  }
  context.stroke();
  context.globalAlpha = 1;
  const fade = context.createLinearGradient(
    0,
    horizonY,
    0,
    horizonY + height * horizonFadeShare,
  );
  fade.addColorStop(0, stylePack.colors.background);
  fade.addColorStop(1, `rgb(from ${stylePack.colors.background} r g b / 0)`);
  context.fillStyle = fade;
  context.fillRect(0, horizonY, width, height * horizonFadeShare);
}

export function GridBackdrop(props: { stylePack: StylePack }): ReactNode {
  const frame = useFrame();
  const { framesPerSecond, output, unit } = useSceneContext();
  const phase = ((frame / framesPerSecond) * linesPerSecond) % 1;
  return (
    <PaintedCanvas
      widthPixels={output.widthPixels}
      heightPixels={output.heightPixels}
      paintKey={String(phase)}
      paint={(context) => {
        paintGrid({ context, stylePack: props.stylePack, phase, unit });
      }}
    />
  );
}
