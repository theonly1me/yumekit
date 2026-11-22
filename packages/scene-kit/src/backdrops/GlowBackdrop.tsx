import { useFrame, useSceneContext } from "@yumekit/scene";
import type { ReactNode } from "react";
import type { StylePack } from "../stylePacks/stylePack.js";
import { glowPathsOf, glowCenterOf } from "./glowPaths.js";
import { PaintedCanvas } from "./PaintedCanvas.js";

const pixelsEach = 8;
const fieldRadiusShare = 0.475;
const fieldOpacity = 0.6;

export function GlowBackdrop(props: {
  stylePack: StylePack;
  seed: string;
}): ReactNode {
  const frame = useFrame();
  const { framesPerSecond, output } = useSceneContext();
  const width = Math.ceil(output.widthPixels / pixelsEach);
  const height = Math.ceil(output.heightPixels / pixelsEach);
  const radius = Math.max(width, height) * fieldRadiusShare;
  const seconds = frame / framesPerSecond;
  const colors = props.stylePack.colors.glow;
  const paths = glowPathsOf(props.seed);
  return (
    <PaintedCanvas
      widthPixels={width}
      heightPixels={height}
      paintKey={`${props.seed}:${String(frame)}`}
      paint={(context) => {
        context.globalAlpha = fieldOpacity;
        for (const [index, path] of paths.entries()) {
          const center = glowCenterOf({ path, seconds });
          const x = (center.xPercent / 100) * width;
          const y = (center.yPercent / 100) * height;
          const color = colors[index] ?? colors[0];
          const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, `rgb(from ${color} r g b / 0)`);
          context.fillStyle = gradient;
          context.fillRect(0, 0, width, height);
        }
      }}
    />
  );
}
