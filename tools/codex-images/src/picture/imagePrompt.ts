import { shapeOf, type PictureSize } from "./pictureShape.ts";

const shapeWords = {
  landscape: "landscape, wider than tall",
  portrait: "portrait, taller than wide",
  square: "square",
} as const;

export function imagePromptOf(options: {
  prompt: string;
  asked: PictureSize | undefined;
  referenceCount: number;
  transparentBackground: boolean;
}): string {
  const { asked } = options;
  return [
    "Make exactly one picture with your image generation tool, then stop.",
    "Run no other tool. Write no file yourself. Answer with one short sentence.",
    ...(asked === undefined
      ? []
      : [
          `Shape: ${shapeWords[shapeOf(asked)]}, in the proportion ${String(asked.width)} by ${String(asked.height)}.`,
        ]),
    ...(options.transparentBackground
      ? ["Give the picture a transparent background."]
      : []),
    ...(options.referenceCount > 0
      ? [
          `The ${String(options.referenceCount)} attached picture(s) are references. Use them as the reference images of the image generation tool.`,
        ]
      : []),
    `Picture: ${options.prompt}`,
  ].join("\n");
}
