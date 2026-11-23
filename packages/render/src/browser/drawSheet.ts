import type { Browser, Page } from "playwright-core";

function findOneColors(): (string | null)[] {
  const tolerance = 4;
  const hex = (value: number) => value.toString(16).padStart(2, "0");
  const colorOf = (image: HTMLImageElement): string | null => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context === null || canvas.width === 0) return null;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const first = [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
    for (let index = 0; index < data.length; index += 4) {
      for (let channel = 0; channel < 3; channel += 1) {
        const value = data[index + channel] ?? 0;
        if (Math.abs(value - (first[channel] ?? 0)) > tolerance) return null;
      }
    }
    return `#${first.map(hex).join("")}`;
  };
  return [...document.querySelectorAll("img")].map(colorOf);
}

async function onPlainPage<Value>(options: {
  browser: Browser;
  size: { widthPixels: number; heightPixels: number };
  html: string;
  work: (page: Page) => Promise<Value>;
}): Promise<Value> {
  const { size } = options;
  const context = await options.browser.newContext({
    viewport: { width: size.widthPixels, height: size.heightPixels },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  try {
    await context.route("**/*", (route) => route.abort("blockedbyclient"));
    const page = await context.newPage();
    await page.setContent(options.html, { waitUntil: "load" });
    return await options.work(page);
  } finally {
    await context.close();
  }
}

export function pictureSourceOf(png: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
}

export function oneColorsOf(options: {
  browser: Browser;
  pngs: Uint8Array[];
}): Promise<(string | null)[]> {
  const images = options.pngs
    .map((png) => `<img src="${pictureSourceOf(png)}" alt="">`)
    .join("");
  return onPlainPage({
    browser: options.browser,
    size: { widthPixels: 64, heightPixels: 64 },
    html: `<!doctype html><html><body>${images}</body></html>`,
    work: (page) => page.evaluate(findOneColors),
  });
}

export function drawSheet(options: {
  browser: Browser;
  html: string;
  size: { widthPixels: number; heightPixels: number };
}): Promise<Uint8Array> {
  return onPlainPage({
    ...options,
    work: (page) => page.screenshot({ type: "png" }),
  });
}
