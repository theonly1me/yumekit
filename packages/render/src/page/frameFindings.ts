import type { StageProject } from "@yumekit/stage";

export interface FrameFindings {
  textOutside: string[];
  firstFrameVideos: string[];
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const edgeTolerancePixels = 2;
const longestText = 40;

function isOutside(options: { rect: Box; stage: Box }): boolean {
  const { rect, stage } = options;
  return (
    rect.left < stage.left - edgeTolerancePixels ||
    rect.top < stage.top - edgeTolerancePixels ||
    rect.right > stage.right + edgeTolerancePixels ||
    rect.bottom > stage.bottom + edgeTolerancePixels
  );
}

function isShown(element: Element): boolean {
  return element.checkVisibility({
    opacityProperty: true,
    visibilityProperty: true,
  });
}

function isInTransition(sceneBox: HTMLElement): boolean {
  const { transform, opacity, clipPath } = sceneBox.style;
  return transform !== "" || opacity !== "" || clipPath !== "";
}

function coversStage(options: { clip: Box; stage: Box }): boolean {
  const { clip, stage } = options;
  return (
    clip.left <= stage.left + edgeTolerancePixels &&
    clip.top <= stage.top + edgeTolerancePixels &&
    clip.right >= stage.right - edgeTolerancePixels &&
    clip.bottom >= stage.bottom - edgeTolerancePixels
  );
}

function isClipping(element: Element): boolean {
  const style = getComputedStyle(element);
  return style.overflowX !== "visible" || style.overflowY !== "visible";
}

function visiblePartOf(options: {
  rect: Box;
  element: Element;
  sceneBox: HTMLElement;
  stage: Box;
}): Box | undefined {
  let visible: Box = options.rect;
  let ancestor: Element | null = options.element;
  while (ancestor !== null && ancestor !== options.sceneBox) {
    const clip = ancestor.getBoundingClientRect();
    if (isClipping(ancestor) && !coversStage({ clip, stage: options.stage })) {
      visible = {
        left: Math.max(visible.left, clip.left),
        top: Math.max(visible.top, clip.top),
        right: Math.min(visible.right, clip.right),
        bottom: Math.min(visible.bottom, clip.bottom),
      };
    }
    ancestor = ancestor.parentElement;
  }
  const isEmpty =
    visible.right <= visible.left || visible.bottom <= visible.top;
  return isEmpty ? undefined : visible;
}

function textOutsideOf(options: {
  sceneBox: HTMLElement;
  stage: Box;
}): string[] {
  const { sceneBox, stage } = options;
  const walker = document.createTreeWalker(sceneBox, NodeFilter.SHOW_TEXT);
  const found: string[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? "";
    const parent = node.parentElement;
    if (text === "" || parent === null || !isShown(parent)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const isCut = [...range.getClientRects()].some((rect) => {
      const visible = visiblePartOf({
        rect,
        element: parent,
        sceneBox,
        stage,
      });
      return visible !== undefined && isOutside({ rect: visible, stage });
    });
    if (isCut) found.push(text.slice(0, longestText));
  }
  return found;
}

function firstFrameVideosOf(options: {
  stageElement: HTMLElement;
  project: StageProject;
}): string[] {
  const firstPictures = new Map<string, string>(
    Object.entries(options.project.assets).flatMap(([assetId, asset]) =>
      asset.framePictures === undefined
        ? []
        : [[`${asset.framePictures.urlPrefix}0.jpg`, assetId] as const],
    ),
  );
  const found = new Set<string>();
  for (const image of options.stageElement.querySelectorAll("img")) {
    const assetId = firstPictures.get(image.getAttribute("src") ?? "");
    if (assetId !== undefined && isShown(image)) found.add(assetId);
  }
  return [...found];
}

export function frameFindingsOf(options: {
  stageElement: HTMLElement;
  project: StageProject | undefined;
}): FrameFindings {
  const { stageElement, project } = options;
  const stage = stageElement.getBoundingClientRect();
  const sceneBoxes = [
    ...stageElement.querySelectorAll<HTMLElement>("[data-scene-id]"),
  ].filter((sceneBox) => !isInTransition(sceneBox));
  return {
    textOutside: [
      ...new Set(
        sceneBoxes.flatMap((sceneBox) => textOutsideOf({ sceneBox, stage })),
      ),
    ],
    firstFrameVideos:
      project === undefined
        ? []
        : firstFrameVideosOf({ stageElement, project }),
  };
}
