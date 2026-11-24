import type { StyleFont, StylePack } from "./stylePack.js";

const loadingByPack = new Map<string, Promise<void>>();

function fontFaceRule(options: { font: StyleFont; file: URL }): string {
  const { font, file } = options;
  return [
    "@font-face {",
    `font-family: "${font.family}";`,
    "font-style: normal;",
    `font-weight: ${String(font.weight)};`,
    "font-display: block;",
    `src: url("${file.href}") format("woff2");`,
    "}",
  ].join(" ");
}

async function loadFont(font: StyleFont): Promise<void> {
  try {
    await document.fonts.load(`${String(font.weight)} 16px "${font.family}"`);
  } catch {
    return;
  }
}

async function declareAndLoad(stylePack: StylePack): Promise<void> {
  const fonts = [stylePack.fonts.display, stylePack.fonts.body];
  const style = document.createElement("style");
  style.dataset["yumekitStylePack"] = stylePack.name;
  style.textContent = fonts
    .flatMap((font) =>
      font.file === undefined ? [] : [fontFaceRule({ font, file: font.file })],
    )
    .join("\n");
  document.head.append(style);
  await Promise.all(fonts.map(loadFont));
}

export function loadStylePackFonts(stylePack: StylePack): Promise<void> {
  const loading =
    loadingByPack.get(stylePack.name) ?? declareAndLoad(stylePack);
  loadingByPack.set(stylePack.name, loading);
  return loading;
}
