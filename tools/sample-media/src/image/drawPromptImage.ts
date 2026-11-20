import { createHash } from "node:crypto";
import {
  glyphHeight,
  glyphRowsByCharacter,
  glyphWidth,
  unknownGlyphRows,
} from "./glyphs.ts";
import type { RgbaImage } from "./png.ts";

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

const maximumCharactersPerLine = 24;
const maximumLines = 8;
const glyphCellWidth = glyphWidth + 1;
const glyphCellHeight = glyphHeight + 2;
const textAreaShare = 0.8;
const opaque = 255;

export function promptColor(prompt: string): Color {
  const [red = 0, green = 0, blue = 0] = createHash("sha256")
    .update(prompt)
    .digest();
  return { red, green, blue, alpha: opaque };
}

export function contrastingColor(background: Color): Color {
  const luminance =
    0.2126 * background.red +
    0.7152 * background.green +
    0.0722 * background.blue;
  const level = luminance > 128 ? 0 : opaque;
  return { red: level, green: level, blue: level, alpha: opaque };
}

function wrapLines(prompt: string): string[] {
  const lines: string[] = [];
  let currentLine = "";
  for (const word of prompt.toUpperCase().split(/\s+/).filter(Boolean)) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maximumCharactersPerLine) {
      currentLine = candidate;
      continue;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word.slice(0, maximumCharactersPerLine);
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, maximumLines);
}

export function fill(options: { image: RgbaImage; color: Color }): void {
  const { image, color } = options;
  for (let offset = 0; offset < image.pixels.length; offset += 4) {
    image.pixels.set([color.red, color.green, color.blue, color.alpha], offset);
  }
}

function drawGlyph(options: {
  image: RgbaImage;
  character: string;
  left: number;
  top: number;
  scale: number;
  color: Color;
}): void {
  const { image, left, top, scale, color } = options;
  const rows = glyphRowsByCharacter[options.character] ?? unknownGlyphRows;
  for (const [rowIndex, row] of rows.entries()) {
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      if (row.charAt(columnIndex) !== "1") continue;
      for (let blockRow = 0; blockRow < scale; blockRow += 1) {
        for (let blockColumn = 0; blockColumn < scale; blockColumn += 1) {
          const x = left + columnIndex * scale + blockColumn;
          const y = top + rowIndex * scale + blockRow;
          const offset = (y * image.width + x) * 4;
          image.pixels.set(
            [color.red, color.green, color.blue, color.alpha],
            offset,
          );
        }
      }
    }
  }
}

export function drawTextLines(options: {
  image: RgbaImage;
  lines: string[];
  color: Color;
}): void {
  const { image, lines } = options;
  const { width, height } = image;
  const longestLine = Math.max(1, ...lines.map((line) => line.length));
  const scale = Math.floor(
    Math.min(
      (width * textAreaShare) / (longestLine * glyphCellWidth),
      (height * textAreaShare) / (Math.max(1, lines.length) * glyphCellHeight),
    ),
  );
  if (scale < 1) return;
  const blockTop = Math.floor(
    (height - lines.length * glyphCellHeight * scale) / 2,
  );
  for (const [lineIndex, line] of lines.entries()) {
    const lineLeft = Math.floor(
      (width - line.length * glyphCellWidth * scale) / 2,
    );
    for (
      let characterIndex = 0;
      characterIndex < line.length;
      characterIndex += 1
    ) {
      drawGlyph({
        image,
        character: line.charAt(characterIndex),
        left: lineLeft + characterIndex * glyphCellWidth * scale,
        top: blockTop + lineIndex * glyphCellHeight * scale,
        scale,
        color: options.color,
      });
    }
  }
}

export function drawPromptImage(options: {
  prompt: string;
  width: number;
  height: number;
  transparentBackground: boolean;
}): RgbaImage {
  const { width, height } = options;
  const image = { width, height, pixels: new Uint8Array(width * height * 4) };
  const background = promptColor(options.prompt);
  const textColor = options.transparentBackground
    ? background
    : contrastingColor(background);
  if (!options.transparentBackground) fill({ image, color: background });
  drawTextLines({
    image,
    lines: wrapLines(options.prompt),
    color: textColor,
  });
  return image;
}
