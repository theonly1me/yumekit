import { loadStylePackFonts, stylePackOf } from "@yumekit/scene-kit";
import type { PageFont, StagePageData } from "./stagePageData.js";

const loadedFonts = new Map<string, Promise<void>>();

function keyOf(font: PageFont): string {
  return JSON.stringify([font.family, font.url, font.weight, font.style]);
}

async function loadProjectFont(font: PageFont): Promise<void> {
  const face = new FontFace(font.family, `url("${font.url}")`, {
    ...(font.weight === undefined ? {} : { weight: font.weight }),
    ...(font.style === undefined ? {} : { style: font.style }),
  });
  document.fonts.add(await face.load());
}

function projectFontLoad(font: PageFont): Promise<void> {
  const key = keyOf(font);
  const known = loadedFonts.get(key);
  if (known !== undefined) return known;
  const loading = loadProjectFont(font).catch((error: unknown) => {
    loadedFonts.delete(key);
    throw new Error(
      `The font "${font.family}" of the project did not load. Import the font file again.`,
      { cause: error },
    );
  });
  loadedFonts.set(key, loading);
  return loading;
}

export async function loadPageFonts(pageData: StagePageData): Promise<void> {
  await Promise.all([
    loadStylePackFonts(stylePackOf(pageData.look)),
    ...pageData.fonts.map(projectFontLoad),
  ]);
}
