import type { SceneOutput } from "@yumekit/scene";

function fillOutput(options: {
  element: HTMLElement;
  output: SceneOutput;
}): void {
  const { style } = options.element;
  style.position = "absolute";
  style.left = "0";
  style.top = "0";
  style.width = `${String(options.output.widthPixels)}px`;
  style.height = `${String(options.output.heightPixels)}px`;
}

export function prepareStageElement(options: {
  element: HTMLElement;
  output: SceneOutput;
}): void {
  const { element, output } = options;
  element.replaceChildren();
  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.style.width = `${String(output.widthPixels)}px`;
  element.style.height = `${String(output.heightPixels)}px`;
}

export function createOutputBox(options: {
  parent: HTMLElement;
  output: SceneOutput;
  atBack?: boolean;
}): HTMLElement {
  const box = document.createElement("div");
  fillOutput({ element: box, output: options.output });
  if (options.atBack === true) {
    options.parent.prepend(box);
  } else {
    options.parent.append(box);
  }
  return box;
}
