import { seededRandom, useSceneContext } from "@yumekit/scene";
import type { ReactNode } from "react";
import { PaintedCanvas } from "./PaintedCanvas.js";

const grainOpacity = 0.09;
const pixelsEach = 1;

function paintGrain(options: {
  context: CanvasRenderingContext2D;
  seed: string;
  widthPixels: number;
  heightPixels: number;
}) {
  const { context, widthPixels, heightPixels } = options;
  const picture = context.createImageData(widthPixels, heightPixels);
  const random = seededRandom(options.seed);
  for (let index = 0; index < picture.data.length; index += 4) {
    const shade = random() < 0.5 ? 0 : 255;
    picture.data[index] = shade;
    picture.data[index + 1] = shade;
    picture.data[index + 2] = shade;
    picture.data[index + 3] = Math.round(random() * grainOpacity * 255);
  }
  context.putImageData(picture, 0, 0);
}

export function GrainBackdrop(props: { seed: string }): ReactNode {
  const { output } = useSceneContext();
  const widthPixels = Math.ceil(output.widthPixels / pixelsEach);
  const heightPixels = Math.ceil(output.heightPixels / pixelsEach);
  return (
    <PaintedCanvas
      widthPixels={widthPixels}
      heightPixels={heightPixels}
      paintKey={props.seed}
      paint={(context) => {
        paintGrain({ context, seed: props.seed, widthPixels, heightPixels });
      }}
    />
  );
}
