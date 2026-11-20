import type { JsonObject, SceneOutput } from "@yumekit/scene";
import { mountKitScene } from "./mountKitScene.js";

export const unitPixels = 1080 / 100;
const durationFrames = 150;

export async function mountSettled(options: {
  name: string;
  props: JsonObject;
  output: SceneOutput;
}): Promise<HTMLElement> {
  const { element, mounted } = await mountKitScene({
    ...options,
    durationFrames,
  });
  await mounted.seek(durationFrames - 1);
  return element;
}

export function boxOf(options: {
  frame: HTMLElement;
  element: Element | null | undefined;
}): DOMRect {
  if (options.element === null || options.element === undefined) {
    throw new Error("The scene does not show the box");
  }
  const frame = options.frame.getBoundingClientRect();
  const rect = options.element.getBoundingClientRect();
  return new DOMRect(
    rect.left - frame.left,
    rect.top - frame.top,
    rect.width,
    rect.height,
  );
}

export function middleBetweenMarginAndCaptions(output: SceneOutput): number {
  return (8 * unitPixels + output.heightPixels - 16 * unitPixels) / 2;
}

export function middleOf(box: DOMRect): number {
  return box.top + box.height / 2;
}
