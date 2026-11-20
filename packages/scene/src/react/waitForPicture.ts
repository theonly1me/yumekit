import type { HoldRegistry } from "./holdRegistry.js";

async function decodeImage(image: HTMLImageElement): Promise<void> {
  try {
    await image.decode();
  } catch (error) {
    throw new Error(
      `The scene image ${image.currentSrc || image.src} did not decode`,
      {
        cause: error,
      },
    );
  }
}

export async function waitForPicture(options: {
  element: HTMLElement;
  holdRegistry: HoldRegistry;
}): Promise<void> {
  const images = [...options.element.querySelectorAll("img")];
  await Promise.all([
    document.fonts.ready,
    ...images.map(decodeImage),
    options.holdRegistry.allReleased(),
  ]);
}
