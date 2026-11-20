import {
  contrastingColor,
  drawTextLines,
  fill,
  promptColor,
} from "../image/drawPromptImage.ts";

export function counterFramesOf(options: {
  prompt: string;
  width: number;
  height: number;
  frameCount: number;
}): (frameIndex: number) => Uint8Array {
  const { width, height } = options;
  const background = promptColor(options.prompt);
  const textColor = contrastingColor(background);
  const backgroundImage = {
    width,
    height,
    pixels: new Uint8Array(width * height * 4),
  };
  fill({ image: backgroundImage, color: background });
  const digitCount = String(Math.max(0, options.frameCount - 1)).length;
  return (frameIndex) => {
    const image = {
      width,
      height,
      pixels: backgroundImage.pixels.slice(),
    };
    drawTextLines({
      image,
      lines: [String(frameIndex).padStart(digitCount, "0")],
      color: textColor,
    });
    return image.pixels;
  };
}
