const tolerancePixels = 1;

function isDecorative(node: Node): boolean {
  const parent = node instanceof Element ? node : node.parentElement;
  return (parent?.closest('[aria-hidden="true"]') ?? null) !== null;
}

function textRects(element: HTMLElement): DOMRect[] {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const rects: DOMRect[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if ((node.textContent ?? "").trim() === "" || isDecorative(node)) {
      continue;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    rects.push(...range.getClientRects());
  }
  return rects;
}

function elementRects(element: HTMLElement): DOMRect[] {
  return [...element.querySelectorAll("*")]
    .filter((child) => !isDecorative(child))
    .map((child) => child.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
}

export function contentRects(element: HTMLElement): DOMRect[] {
  return [...textRects(element), ...elementRects(element)];
}

export function rectsOutside(element: HTMLElement): DOMRect[] {
  const frame = element.getBoundingClientRect();
  return contentRects(element).filter(
    (rect) =>
      rect.left < frame.left - tolerancePixels ||
      rect.top < frame.top - tolerancePixels ||
      rect.right > frame.right + tolerancePixels ||
      rect.bottom > frame.bottom + tolerancePixels,
  );
}

export function textRectCount(element: HTMLElement): number {
  return textRects(element).length;
}

function shownOpacity(node: Node): number {
  let opacity = 1;
  for (
    let ancestor = node.parentElement;
    ancestor !== null;
    ancestor = ancestor.parentElement
  ) {
    opacity *= Number(getComputedStyle(ancestor).opacity);
  }
  return opacity;
}

export function shownTexts(element: HTMLElement): string[] {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: string[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const parent = node.parentElement;
    const text = (node.textContent ?? "").trim();
    if (
      text !== "" &&
      parent !== null &&
      getComputedStyle(parent).visibility === "visible" &&
      shownOpacity(node) > 0.99
    ) {
      texts.push(text);
    }
  }
  return texts;
}
